import { Inter } from "next/font/google";
import "./globals.css";
import { LoadingProvider } from "@/components/LoadingProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Expense Tracker",
  description: "Track your expenses efficiently",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}