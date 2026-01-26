import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";
import "./custom.css";

export default {
  ...DefaultTheme,
  setup() {
    onMounted(() => {
      const noscript = document.createElement("noscript");
      noscript.innerHTML = `
    <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KTM6GP5F"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
  `;
      document.body.prepend(noscript);
    });
  },
};
