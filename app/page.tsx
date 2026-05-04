import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "./(main)/page";

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Suspense>
          <HomePage />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
