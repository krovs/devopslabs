import { mount } from "svelte";
import App from "./App.svelte";
import "@fontsource/recursive/latin-700.css";
import "../styles.css";

const app = mount(App, {
  target: document.getElementById("app") as HTMLElement,
});

export default app;
