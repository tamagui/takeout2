// stub for @nandorojo/galeria on web
// galeria is a native-only package for image viewing
// this shim prevents the package from being bundled on web

export function Galeria({ children }: { children: React.ReactNode }) {
  return children
}

Galeria.Image = function GaleriaImage({ children }: { children: React.ReactNode }) {
  return children
}

Galeria.Popup = function GaleriaPopup() {
  return null
}
