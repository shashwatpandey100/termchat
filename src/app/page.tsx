import { TerminalWindow } from "@/components/terminal-window";
import { HomeForm } from "@/components/home-form";

export default function Home() {
  return (
    <main
      style={{
        backgroundImage: "url(/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="h-screen flex items-center justify-center p-0 md:p-4"
    >
      <TerminalWindow title="termchat" className="h-full w-full md:h-[85vh] md:w-[90vw]">
        <div className="p-5 space-y-4">
          <pre className="ascii-gradient text-lg leading-tight font-bold tracking-wider">
{`▀█▀ █▀▀ █▀█ █▀▄▀█ █▀▀ █ █ █▀█ ▀█▀
 █  ██▄ █▀▄ █ ▀ █ █▄▄ █▀█ █▀█  █`}
          </pre>

          <div className="text-sm space-y-1">
            <p className="text-gray-300">Welcome to TermChat v1.0.0</p>
            <p className="text-gray-600">
              Encrypted terminal chat rooms. Share the link and password.
            </p>
          </div>

          <div className="border-t border-white/[0.04] pt-4">
            <HomeForm />
          </div>
        </div>
      </TerminalWindow>
    </main>
  );
}
