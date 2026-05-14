# Reusable Picker Rollout Checklist

- [ ] Identify all source/document color edit surfaces beyond Project Documents.
- [ ] Replace per-surface custom color UI with `components/ui/advanced-color-picker.tsx`.
- [ ] Confirm each surface keeps existing persistence contracts and default-reset behavior.
- [ ] Decide whether backend storage should remain token-based or support freeform RGBA values.
- [ ] Add shared tests for keyboard + pointer interactions on saturation, hue, and alpha controls.
- [ ] Validate dark/light visual parity and focus-visible behavior on all integrated surfaces.
