import { useMemo } from "react";
import Sharing from "./components/sharing/Sharing";
import Receiving from "./components/receiving/Receiving";

function App() {
  const route = useMemo(() => {
    const path = window.location.pathname || "/";
    // expects /s/:token
    if (path.startsWith("/s/")) {
      return { name: "receive", token: path.slice(3) };
    }
    return { name: "share" };
  }, []);

  if (route.name === "receive") {
    return <Receiving token={route.token} />;
  }

  return (
    <>
      <Sharing />
    </>
  );
}

export default App;
