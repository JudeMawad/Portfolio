export function setupTerminalStatus() {
  const header = document.querySelector("[data-site-header]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const statusLine = header?.querySelector("[data-header-status]");
  const statusText = statusLine?.querySelector("[data-header-status-text]");
  const statusExchanges = [
    { command: "~/Portfolio$ whoami", answer: "JUDE MAWAD" },
    { command: "~/Portfolio$ pwd", answer: "/home/jude/Portfolio" },
    { command: "~/Portfolio$ cat focus.txt", answer: "SOFTWARE / SYSTEMS / PRODUCT" },
    { command: "~/Portfolio$ git branch --show-current", answer: "building" },
    { command: "~/Portfolio$ git status --short", answer: "M  currently-building" },
    { command: "~/Portfolio$ ls projects/", answer: "ignite  syndexus  the-cube" },
    { command: "~/Portfolio$ echo $STATUS", answer: "ACTIVE" }
  ];
  let statusIndex = 0;
  let statusTimer = 0;

  const getStatusPause = (text, baseDuration, perCharacter, maximumDuration) => (
    Math.min(maximumDuration, baseDuration + text.length * perCharacter)
  );

  const stopStatusAnimation = () => {
    window.clearTimeout(statusTimer);
    statusTimer = 0;
  };

  const typeStatusText = (text, characterDelay, onComplete) => {
    if (!statusText || reduceMotion.matches) return;
    let characterIndex = 0;
    statusText.textContent = "";
    statusLine?.classList.add("is-typing");

    const typeNextCharacter = () => {
      if (reduceMotion.matches || !statusText) {
        configureStatusAnimation();
        return;
      }

      characterIndex += 1;
      statusText.textContent = text.slice(0, characterIndex);

      if (characterIndex < text.length) {
        statusTimer = window.setTimeout(typeNextCharacter, characterDelay);
        return;
      }

      statusLine?.classList.remove("is-typing");
      onComplete();
    };

    statusTimer = window.setTimeout(typeNextCharacter, characterDelay);
  };

  const switchStatusText = (isAnswer, text, characterDelay, onComplete) => {
    statusLine?.classList.add("is-switching");
    statusTimer = window.setTimeout(() => {
      statusLine?.classList.toggle("is-answer", isAnswer);
      statusLine?.classList.remove("is-switching");
      typeStatusText(text, characterDelay, onComplete);
    }, 140);
  };

  const runStatusExchange = (transitionIn = false) => {
    if (!statusText || reduceMotion.matches) return;
    const exchange = statusExchanges[statusIndex];

    const showAnswer = () => {
      statusTimer = window.setTimeout(() => {
        switchStatusText(true, exchange.answer, 38, () => {
          statusTimer = window.setTimeout(() => {
            statusIndex = (statusIndex + 1) % statusExchanges.length;
            runStatusExchange(true);
          }, getStatusPause(exchange.answer, 1900, 40, 3100));
        });
      }, getStatusPause(exchange.command, 850, 18, 1600));
    };

    if (transitionIn) {
      switchStatusText(false, exchange.command, 58, showAnswer);
      return;
    }

    statusLine?.classList.remove("is-answer");
    typeStatusText(exchange.command, 58, showAnswer);
  };

  const configureStatusAnimation = () => {
    stopStatusAnimation();
    statusIndex = 0;
    statusLine?.classList.remove("is-typing", "is-switching");
    statusLine?.classList.toggle("is-answer", reduceMotion.matches);
    if (statusText) statusText.textContent = reduceMotion.matches
      ? statusExchanges[0].answer
      : "";
    if (!reduceMotion.matches && !document.hidden) runStatusExchange();
  };

  reduceMotion.addEventListener("change", configureStatusAnimation);
  const syncVisibility = () => {
    if (document.hidden) stopStatusAnimation();
    else configureStatusAnimation();
  };
  document.addEventListener("visibilitychange", syncVisibility);
  configureStatusAnimation();
  return { dispose() {
    stopStatusAnimation();
    reduceMotion.removeEventListener("change", configureStatusAnimation);
    document.removeEventListener("visibilitychange", syncVisibility);
  } };
}
