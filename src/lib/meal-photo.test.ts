import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareMealPhoto, analyseMealPhoto } from "./meal-photo";
const session = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: session } }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("meal photo preprocessing", () => {
  it("redraws and resizes images before creating a stripped JPEG", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 4000, height: 2000, close }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillRect: vi.fn(),
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    const encode = vi
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockReturnValue("data:image/jpeg;base64,/9j/");
    const file = {
      type: "image/jpeg",
      size: 100,
      slice: () => ({ arrayBuffer: async () => new Uint8Array([255, 216, 255]).buffer }),
    } as unknown as File;
    const output = await prepareMealPhoto(file);
    expect(drawImage.mock.calls[0]?.slice(1)).toEqual([0, 0, 1600, 800]);
    expect(encode).toHaveBeenCalledWith("image/jpeg", 0.8);
    expect(output.image).toBe("data:image/jpeg;base64,/9j/");
    expect(close).toHaveBeenCalledOnce();
  });
  it("does not transmit a photo without a signed-in session", async () => {
    session.getSession.mockResolvedValue({ data: { session: null } });
    const call = vi.fn();
    vi.stubGlobal("fetch", call);
    await expect(analyseMealPhoto("image", "en", "meal")).rejects.toThrow("signin");
    expect(call).not.toHaveBeenCalled();
  });
});
