import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { afterEach, describe, expect, it } from "vitest";
import "@/lib/imageNodeTransformBootstrap";
import {
  allowImageResizeThroughMobileBackdrop,
  applyImageTransformLayout,
  findImageTransformWrapper,
  suppressLegacyDesktopImageTransformMenu,
  updateImageAttributesAt,
} from "@/components/EditorImageTransformBridge";

describe("EditorImageTransformBridge", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("finds the inline-block image wrapper inside a React NodeView", () => {
    document.body.innerHTML = `
      <span class="react-renderer node-image">
        <span class="resizable-image-wrapper" style="display: inline-block">
          <img src="/image.png">
        </span>
      </span>
    `;
    const nodeView = document.querySelector<HTMLElement>(".react-renderer")!;
    const wrapper = document.querySelector<HTMLElement>(".resizable-image-wrapper")!;

    expect(findImageTransformWrapper(nodeView)).toBe(wrapper);
    expect(findImageTransformWrapper(nodeView)).not.toBe(nodeView);
  });

  it("keeps supporting a DOM node nested inside the image wrapper", () => {
    document.body.innerHTML = `
      <span class="resizable-image-wrapper"><img src="/image.png"></span>
    `;
    const image = document.querySelector<HTMLElement>("img")!;

    expect(findImageTransformWrapper(image)).toBe(
      document.querySelector(".resizable-image-wrapper"),
    );
  });

  it("reserves the rotated visual bounds while keeping handles and the px badge upright", () => {
    document.body.innerHTML = `
      <p id="parent">
        <span class="resizable-image-wrapper" style="transform: rotate(90deg); margin: 0">
          <img src="/image.png" width="600" style="width: 600px; height: auto; max-width: 100%">
          <span data-controls style="position:absolute;inset:0">
            <span data-handle style="cursor:nwse-resize"></span>
            <span data-size>600px</span>
          </span>
        </span>
      </p>
    `;
    const parent = document.querySelector<HTMLElement>("#parent")!;
    const wrapper = document.querySelector<HTMLElement>(".resizable-image-wrapper")!;
    const image = wrapper.querySelector<HTMLImageElement>("img")!;
    const handle = wrapper.querySelector<HTMLElement>("[data-handle]")!;
    const badge = wrapper.querySelector<HTMLElement>("[data-size]")!;
    Object.defineProperty(parent, "clientWidth", { value: 800, configurable: true });
    Object.defineProperties(image, {
      naturalWidth: { value: 1200, configurable: true },
      naturalHeight: { value: 600, configurable: true },
      offsetWidth: { value: 600, configurable: true },
      offsetHeight: { value: 300, configurable: true },
    });

    expect(applyImageTransformLayout(wrapper, 90, true)).toBe(true);
    expect(wrapper.style.transform).toBe("none");
    expect(wrapper.style.width).toBe("300px");
    expect(wrapper.style.height).toBe("600px");
    expect(image.style.position).toBe("absolute");
    expect(image.style.transform).toContain("translate(-50%, -50%)");
    expect(image.style.transform).toContain("rotate(90deg)");
    expect(image.style.transform).toContain("scaleX(-1)");
    expect(handle.style.cursor).toBe("nwse-resize");
    expect(badge.style.transform).toBe("");
  });

  it("lets the first resize gesture pass through the compact mobile sheet backdrop", () => {
    document.body.innerHTML = `
      <button aria-label="关闭图片操作" style="pointer-events:auto"></button>
      <button aria-label="Close image actions"></button>
    `;

    expect(allowImageResizeThroughMobileBackdrop()).toBe(2);
    document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      expect(button.style.pointerEvents).toBe("none");
      expect(button.dataset.nowenImageBackdropPassthrough).toBe("true");
    });
  });

  it("hides the duplicated legacy transform block but keeps overflow size actions visible", () => {
    document.body.innerHTML = `
      <div id="toolbar">
        <div data-popover>
          <div id="legacy-heading">图片变换（写入笔记）</div>
          <div id="legacy-grid" class="grid grid-cols-4 gap-1">
            <button></button><button></button><button></button><button></button>
          </div>
          <div id="legacy-divider" class="my-1 h-px bg-app-border"></div>
          <button id="size-25">25%</button>
          <button id="size-50">50%</button>
        </div>
      </div>
    `;
    const toolbar = document.querySelector<HTMLElement>("#toolbar")!;

    expect(suppressLegacyDesktopImageTransformMenu(toolbar)).toBe(true);
    expect(document.querySelector<HTMLElement>("#legacy-heading")!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("#legacy-grid")!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("#legacy-divider")!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>("#size-25")!.hidden).toBe(false);
    expect(document.querySelector<HTMLElement>("#size-50")!.hidden).toBe(false);
  });

  it("updates a selected inline image without dispatching a focus transaction", () => {
    const editor = new Editor({
      extensions: [StarterKit, Image.configure({ inline: true })],
      content: {
        type: "doc",
        content: [{
          type: "paragraph",
          content: [{
            type: "image",
            attrs: { src: "/image.png", rotation: 0, flipX: false },
          }],
        }],
      },
    });

    expect(updateImageAttributesAt(editor, 1, { rotation: 90 })).toBe(true);
    expect(editor.state.doc.nodeAt(1)?.attrs.rotation).toBe(90);
    expect(editor.state.doc.nodeAt(1)?.attrs.src).toBe("/image.png");
    editor.destroy();
  });
});
