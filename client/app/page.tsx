import Header from "./components/Header";
import Heading from "./utils/Heading";
import Hero from "./components/Route/Hero";

export default function Page() {
  return (
    <div>
      <Heading title="Hennigan Irish Dance School"/>
      <Header />
      <Hero />
    </div>
  );
}
