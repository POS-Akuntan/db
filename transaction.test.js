import { JSDOM } from "jsdom";

test("saveTokenFromURL stores token in localStorage", () => {
  const { window } = new JSDOM(``, { url: "https://example.com?token=abc123" });
  global.window = window;
  global.localStorage = { setItem: jest.fn() };

  const saveTokenFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
    }
  };

  saveTokenFromURL();

  expect(global.localStorage.setItem).toHaveBeenCalledWith("token", "abc123");
});
