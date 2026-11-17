import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata = {
  title: "RoadSense AI — Road Defect & Complaint Platform",
  description:
    "AI-powered road monitoring, pothole detection, spatial deduplication, and municipal maintenance management.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-500 selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
