const assert = require("node:assert/strict");
const test = require("node:test");
const palette = require("./palette.json");

function luminance(hex) {
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function blend(foreground, background, opacity = 0.9) {
  return (
    "#" +
    [1, 3, 5]
      .map((offset) =>
        Math.round(
          parseInt(foreground.slice(offset, offset + 2), 16) * opacity +
            parseInt(background.slice(offset, offset + 2), 16) * (1 - opacity),
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

for (const [scheme, colors] of Object.entries(palette)) {
  test(`${scheme}: semantic text remains readable on every app surface`, () => {
    for (const foreground of [
      "ink",
      "inkMuted",
      "iconMuted",
      "brand",
      "risk",
      "safe",
    ]) {
      for (const background of [
        "surface",
        "surfaceCard",
        "surfaceMuted",
        "surfaceBrand",
        "surfaceBrandSoft",
        "surfaceRisk",
        "surfaceSafe",
      ]) {
        const ratio = contrast(colors[foreground], colors[background]);
        assert.ok(
          ratio >= 4.5,
          `${foreground} on ${background}: ${ratio.toFixed(2)}`,
        );
      }
    }
    for (const [foreground, background] of [
      ["onBrand", "brand"],
      ["onRisk", "risk"],
    ]) {
      assert.ok(contrast(colors[foreground], colors[background]) >= 4.5);
    }
  });
  test(`${scheme}: input boundaries meet non-text contrast`, () => {
    for (const surface of [
      "surface",
      "surfaceCard",
      "surfaceMuted",
      "surfaceBrandSoft",
    ]) {
      assert.ok(contrast(colors.border, colors[surface]) >= 3, surface);
    }
  });
  test(`${scheme}: pressed primary, secondary, and destructive labels stay readable`, () => {
    for (const surface of [
      "surface",
      "surfaceCard",
      "surfaceBrand",
      "surfaceBrandSoft",
      "surfaceRisk",
    ]) {
      for (const [foreground, background] of [
        ["onBrand", "brand"],
        ["onRisk", "risk"],
      ]) {
        assert.ok(
          contrast(
            blend(colors[foreground], colors[surface]),
            blend(colors[background], colors[surface]),
          ) >= 4.5,
          `${foreground} on ${background} over ${surface}`,
        );
      }
      for (const foreground of ["brand", "risk"]) {
        assert.ok(
          contrast(
            blend(colors[foreground], colors[surface]),
            colors[surface],
          ) >= 4.5,
          `${foreground} on ${surface}`,
        );
      }
    }
  });
}

test("Tailwind defaults and legacy dark aliases resolve the same semantic variable", () => {
  const config = require("../../tailwind.config.js");
  const colors = config.theme.extend.colors;
  for (const [name, alias] of [
    ["ink", "dark"],
    ["brand", "light"],
    ["risk", "light"],
    ["safe", "light"],
    ["surface", "dark"],
    ["on-brand", "dark"],
  ]) {
    assert.match(colors[name].DEFAULT, /var\(--color-/);
    assert.equal(colors[name].DEFAULT, colors[name][alias]);
  }
});
