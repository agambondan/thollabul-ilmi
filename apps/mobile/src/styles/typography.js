export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    letterSpacing: 0,
  },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0,
  },
  small: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  smallStrong: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  input: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    letterSpacing: 0,
  },
  merge: (base, overrides = {}) => ({
    ...base,
    ...overrides,
  }),
};
