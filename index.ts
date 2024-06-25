import { autorun, computed, configure, makeObservable, observable } from "mobx";
import { Model, model, tProp } from "mobx-keystone";

configure({
  enforceActions: "never",
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: false,
});

// -----------------------------------------------------------------------------
// Some mobx-keystone model

@model("TestApp/Theme")
class Theme extends Model({
  dark: tProp(false).withSetter(),
}) {
  @computed get backgroundColor() { return this.dark ? "#444" : "#ddd"; }
  @computed get color() { return this.dark ? "#fff" : "#000"; }
}

// -----------------------------------------------------------------------------
// A custom element with observable properties (unaware of Theme)

class MyElement extends HTMLElement {
  /*
  A while ago @observable did not work
  (see https://github.com/xaviergonz/mobx-keystone/discussions/533)
  and I had to call makeObservable in the constructor.

  Now that https://github.com/evanw/esbuild/issues/104 is closed and fixed
  (and current vite apparently uses esbuild 0.21.5),
  I hoped that @observable works and a constructor is not needed anymore.

  But still I could not convince esbuild to transform the following code,
  even though I set "target" to "ES2020" and disabled "experimentalDecorators"
  in tsconfig.json
  */
  @observable accessor backgroundColor: string = "yellow";
  @observable accessor color: string = "black";

  connectedCallback() {
    this.style.border = "1px solid black";
    this.style.padding = "5px";
    this.style.fontFamily = "monospace";
    autorun(() => this.style.backgroundColor = this.backgroundColor);
    autorun(() => this.style.color = this.color);
    autorun(() => this.replaceChildren(`${this.color}/${this.backgroundColor}`));
  }
}
customElements.define("my-element", MyElement);

// -----------------------------------------------------------------------------
// An application connecting the mobx-keystone model and the custom element

const theme = new Theme({});

const button = document.createElement("button");
button.append("toggle theme");
button.addEventListener("click", () => theme.setDark(!theme.dark));

const elem = document.createElement("my-element") as MyElement;

autorun(() => elem.backgroundColor = theme.backgroundColor);
autorun(() => elem.color = theme.color);

document.body.append(elem, " ", button);
