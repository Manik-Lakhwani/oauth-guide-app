import "./globals.css";
export const metadata = { title: "OAuth app setup guides", description: "Evidence-tagged guides for creating and getting approval for provider OAuth apps." };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
