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
  Instead of calling makeObservable in the constructor I would prefer
  to just prepend "@observable accessor" to the property declarations.

  According to https://mobx.js.org/enabling-decorators.html this requires
  the TypeScript compiler option "experimentalDecorators" to be unset.
  But then the compiler leaves the `@model` above in the JS code, which
  Firefox 120 does not like.

  Is there a way to have both mobx-keystone class annotations and
  mobx accessor annotations with the same TypeScript config?
  */

  backgroundColor: string;
  color: string;

  constructor() {
    super();
    makeObservable(this, {
      backgroundColor: observable,
      color: observable,
    });
  }

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
