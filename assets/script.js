(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector(".theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  const gallery = document.getElementById("avp-gallery");

  const setTheme = (theme, persist = true) => {
    root.dataset.theme = theme;
    const isLight = theme === "light";
    themeButton?.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
    themeMeta?.setAttribute("content", isLight ? "#f4f6f5" : "#03101d");

    if (persist) {
      try {
        localStorage.setItem("portfolio-theme", theme);
      } catch (_) {
        // A failed preference save should never block the theme control.
      }
    }
  };

  setTheme(root.dataset.theme === "light" ? "light" : "dark", false);

  themeButton?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  const closeNavigation = () => {
    nav?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open navigation");
  };

  navToggle?.addEventListener("click", () => {
    const willOpen = navToggle.getAttribute("aria-expanded") !== "true";
    nav?.classList.toggle("is-open", willOpen);
    navToggle.setAttribute("aria-expanded", String(willOpen));
    navToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
  });

  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.classList.contains("is-open")) closeNavigation();
  });

  document.querySelectorAll("[data-gallery-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof gallery?.showModal === "function") {
        gallery.showModal();
      } else {
        gallery?.setAttribute("open", "");
      }
    });
  });

  document.querySelectorAll("[data-gallery-close]").forEach((button) => {
    button.addEventListener("click", () => gallery?.close());
  });

  gallery?.addEventListener("click", (event) => {
    if (event.target === gallery) gallery.close();
  });

  document.querySelectorAll("[data-montford-media]").forEach((media) => {
    const tabs = [...media.querySelectorAll("[data-montford-tab]")];
    const panels = [...media.querySelectorAll("[data-montford-panel]")];
    const video = media.querySelector("[data-montford-video]");
    const filmLoadButton = media.querySelector("[data-montford-film-load]");
    const filmStatus = media.querySelector("[data-montford-film-status]");
    const filmFallback = media.querySelector("[data-montford-film-fallback]");
    const modelStage = media.querySelector("[data-montford-model-stage]");
    const modelPoster = media.querySelector(".montford-model-poster");
    const modelHost = media.querySelector("[data-montford-model-host]");
    const modelLoadButton = media.querySelector("[data-montford-model-load]");
    const modelActions = media.querySelector("[data-montford-model-actions]");
    const animationLoadButton = media.querySelector("[data-montford-animation-load]");
    const animationControls = media.querySelector("[data-montford-animation-controls]");
    const modelStatus = media.querySelector("[data-montford-model-status]");
    const fallback = media.querySelector("[data-montford-fallback]");
    const resetViewButton = media.querySelector("[data-montford-reset-view]");
    const playButton = media.querySelector("[data-montford-play]");
    const pauseButton = media.querySelector("[data-montford-pause]");
    const restartButton = media.querySelector("[data-montford-restart]");
    const timeline = media.querySelector("[data-montford-timeline]");
    const timeOutput = media.querySelector("[data-montford-time]");

    if (!tabs.length || !panels.length || !video || !modelHost || !modelStage) return;

    const animationName = "FOOD_CARGO_DEPLOYMENT_NOTIONAL";
    const nominalDuration = 60;
    const initialCameraOrbit = "35deg 68deg 90%";
    let viewerModulePromise;
    let modelViewer;
    let animationReady = false;
    let animationPlaying = false;
    let animationFrame;

    const setStatus = (element, message) => {
      if (element) element.textContent = message;
    };

    const stopAnimationClock = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
    };

    const formatTime = (seconds) => {
      const bounded = Math.min(nominalDuration, Math.max(0, Number(seconds) || 0));
      const wholeSeconds = bounded >= nominalDuration - 0.1 ? nominalDuration : Math.floor(bounded);
      const minutes = Math.floor(wholeSeconds / 60);
      const remainder = wholeSeconds % 60;
      return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    };

    const updateAnimationTime = (seconds) => {
      const current = Math.min(nominalDuration, Math.max(0, Number(seconds) || 0));
      if (timeline) {
        timeline.value = String(current);
        timeline.setAttribute(
          "aria-valuetext",
          `${Math.round(current)} seconds of ${nominalDuration} seconds`,
        );
      }
      if (timeOutput) timeOutput.textContent = `${formatTime(current)} / 01:00`;
    };

    const markAnimationComplete = () => {
      stopAnimationClock();
      if (modelViewer && animationReady) modelViewer.pause();
      animationPlaying = false;
      updateAnimationTime(nominalDuration);
      setStatus(modelStatus, "Deployment animation complete.");
    };

    const tickAnimationTime = () => {
      if (!modelViewer || !animationReady) return;
      const currentTime = Number(modelViewer.currentTime) || 0;
      const effectiveDuration = Math.min(Number(modelViewer.duration) || nominalDuration, nominalDuration);
      if (currentTime >= effectiveDuration - 0.05) {
        markAnimationComplete();
        return;
      }
      updateAnimationTime(currentTime);
      animationFrame = requestAnimationFrame(tickAnimationTime);
    };

    const pauseModel = (announce = false) => {
      const wasPlaying = animationPlaying;
      stopAnimationClock();
      if (modelViewer && animationReady) modelViewer.pause();
      animationPlaying = false;
      if (announce && wasPlaying && modelViewer) {
        updateAnimationTime(modelViewer.currentTime);
        setStatus(modelStatus, `Deployment animation paused at ${formatTime(modelViewer.currentTime)} because the 3D view became inactive.`);
      }
    };

    const activateTab = (nextTab, moveFocus = false) => {
      tabs.forEach((tab) => {
        const selected = tab === nextTab;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });

      panels.forEach((panel) => {
        panel.hidden = panel.dataset.montfordPanel !== nextTab.dataset.montfordTab;
      });

      if (nextTab.dataset.montfordTab !== "film") video.pause();
      if (nextTab.dataset.montfordTab !== "model") pauseModel(true);
      if (moveFocus) nextTab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(tab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (typeof nextIndex !== "number") return;
        event.preventDefault();
        activateTab(tabs[nextIndex], true);
      });
    });

    filmLoadButton?.addEventListener("click", () => {
      if (filmLoadButton.getAttribute("aria-disabled") === "true") return;
      if (!video.src) {
        video.src = video.dataset.src;
        video.load();
      }
      video.removeAttribute("aria-hidden");
      video.removeAttribute("inert");
      video.tabIndex = 0;
      filmLoadButton.setAttribute("aria-disabled", "true");
      setStatus(filmStatus, "Loading the 60-second film…");
      video.play().catch(() => {
        filmLoadButton.removeAttribute("aria-disabled");
        setStatus(filmStatus, "The film is ready. Use the video controls to begin playback.");
      });
    });

    video.addEventListener("loadedmetadata", () => {
      const shouldMoveFocus = document.activeElement === filmLoadButton;
      if (filmLoadButton) {
        filmLoadButton.removeAttribute("aria-disabled");
        filmLoadButton.hidden = true;
      }
      if (shouldMoveFocus) video.focus();
      setStatus(filmStatus, "Film loaded. Use the video controls to play or seek.");
    });
    video.addEventListener("playing", () => setStatus(filmStatus, "Film playing."));
    video.addEventListener("pause", () => {
      if (!video.ended && video.currentTime > 0) setStatus(filmStatus, "Film paused.");
    });
    video.addEventListener("ended", () => setStatus(filmStatus, "Film complete."));
    video.addEventListener("error", () => {
      const shouldMoveFocus = [filmLoadButton, video].includes(document.activeElement);
      if (filmLoadButton) {
        filmLoadButton.setAttribute("aria-disabled", "true");
        filmLoadButton.hidden = true;
      }
      video.setAttribute("aria-hidden", "true");
      video.setAttribute("inert", "");
      video.tabIndex = -1;
      if (filmFallback) filmFallback.hidden = false;
      if (shouldMoveFocus) filmFallback?.querySelector("a")?.focus();
      setStatus(filmStatus, "The embedded film could not be loaded. A direct download is available below.");
    });

    const supportsWebGL = () => {
      try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      } catch (_) {
        return false;
      }
    };

    const waitForModelViewer = async () => {
      if (!supportsWebGL()) throw new Error("WebGL is unavailable");
      if (!viewerModulePromise) {
        viewerModulePromise = import(media.dataset.viewerUrl).catch((error) => {
          viewerModulePromise = undefined;
          throw error;
        });
      }
      await viewerModulePromise;
      await Promise.race([
        customElements.whenDefined("model-viewer"),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error("Viewer library timed out")), 15000);
        }),
      ]);
    };

    const showModelFallback = (message) => {
      const activeElement = document.activeElement;
      const shouldMoveFocus =
        modelStage.contains(activeElement) ||
        modelActions?.contains(activeElement) ||
        animationControls?.contains(activeElement);
      pauseModel();
      animationReady = false;
      modelStage.classList.remove("is-loading", "has-model");
      modelPoster?.removeAttribute("aria-hidden");
      if (modelViewer) modelViewer.remove();
      modelViewer = undefined;
      if (modelLoadButton) {
        modelLoadButton.setAttribute("aria-disabled", "true");
        modelLoadButton.hidden = true;
      }
      if (modelActions) modelActions.hidden = true;
      if (animationControls) animationControls.hidden = true;
      if (fallback) fallback.hidden = false;
      if (shouldMoveFocus) fallback?.querySelector("a")?.focus();
      setStatus(modelStatus, message);
    };

    const loadViewerSource = (source) =>
      new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => finish(new Error("Model loading timed out")), 45000);

        const finish = (error) => {
          window.clearTimeout(timeout);
          modelViewer.removeEventListener("load", onLoad);
          modelViewer.removeEventListener("error", onError);
          if (error) reject(error);
          else resolve();
        };

        const onLoad = () => finish();
        const onError = () => finish(new Error("Model loading failed"));

        modelViewer.addEventListener("load", onLoad);
        modelViewer.addEventListener("error", onError);
        modelViewer.setAttribute("src", source);
      });

    modelLoadButton?.addEventListener("click", async () => {
      if (modelLoadButton.getAttribute("aria-disabled") === "true") return;
      modelLoadButton.setAttribute("aria-disabled", "true");
      modelStage.classList.add("is-loading");
      setStatus(modelStatus, "Loading the interactive viewer and 5.6 MB static model…");

      try {
        await waitForModelViewer();
        modelViewer = document.createElement("model-viewer");
        modelViewer.setAttribute("alt", "Interactive notional model of USNS Montford Point configured for distributed food-logistics craft deployment");
        modelViewer.setAttribute("poster", "assets/montford-point/montford-point-poster.webp");
        modelViewer.setAttribute("reveal", "manual");
        modelViewer.setAttribute("loading", "eager");
        modelViewer.setAttribute("camera-controls", "");
        modelViewer.setAttribute("camera-orbit", initialCameraOrbit);
        modelViewer.setAttribute("interaction-prompt", "none");
        modelViewer.setAttribute("touch-action", "pan-y");
        modelViewer.setAttribute("tabindex", "0");
        modelViewer.addEventListener("finished", markAnimationComplete);
        modelHost.replaceChildren(modelViewer);

        await loadViewerSource(media.dataset.staticSrc);
        modelViewer.dismissPoster?.();
        modelStage.classList.remove("is-loading");
        modelStage.classList.add("has-model");
        modelPoster?.setAttribute("aria-hidden", "true");
        const shouldMoveFocus = document.activeElement === modelLoadButton;
        modelLoadButton.removeAttribute("aria-disabled");
        modelLoadButton.hidden = true;
        if (modelActions) modelActions.hidden = false;
        if (shouldMoveFocus) modelViewer.focus();
        setStatus(modelStatus, "Static model loaded. Drag to orbit, scroll or pinch to zoom, and use Reset view when needed.");
      } catch (_) {
        showModelFallback("The interactive viewer could not be loaded. Direct model downloads are available below.");
      }
    });

    resetViewButton?.addEventListener("click", () => {
      if (!modelViewer) return;
      modelViewer.setAttribute("camera-orbit", initialCameraOrbit);
      modelViewer.setAttribute("camera-target", "auto auto auto");
      modelViewer.jumpCameraToGoal?.();
      setStatus(modelStatus, "Model view reset.");
    });

    animationLoadButton?.addEventListener("click", async () => {
      if (!modelViewer) return;
      if (animationLoadButton.getAttribute("aria-disabled") === "true") return;
      animationLoadButton.setAttribute("aria-disabled", "true");
      pauseModel();
      modelStage.classList.add("is-loading");
      setStatus(modelStatus, "Loading the 13.9 MB deployment animation…");

      try {
        modelViewer.setAttribute("animation-name", animationName);
        await loadViewerSource(media.dataset.animatedSrc);
        if (!modelViewer.availableAnimations?.includes(animationName)) {
          throw new Error("Expected animation is missing");
        }
        modelViewer.animationName = animationName;
        modelViewer.currentTime = 0;
        modelViewer.pause();
        modelViewer.dismissPoster?.();
        animationReady = true;
        animationPlaying = false;
        updateAnimationTime(0);
        modelStage.classList.remove("is-loading");
        modelStage.classList.add("has-model");
        modelPoster?.setAttribute("aria-hidden", "true");
        const shouldMoveFocus = document.activeElement === animationLoadButton;
        animationLoadButton.removeAttribute("aria-disabled");
        animationLoadButton.hidden = true;
        if (animationControls) animationControls.hidden = false;
        if (shouldMoveFocus) playButton?.focus();
        setStatus(modelStatus, "Deployment animation ready at 00:00. It will not play until requested.");
      } catch (_) {
        showModelFallback("The animated model could not be loaded. Direct model downloads are available below.");
      }
    });

    playButton?.addEventListener("click", () => {
      if (!modelViewer || !animationReady) return;
      if (modelViewer.currentTime >= nominalDuration - 0.1) modelViewer.currentTime = 0;
      modelViewer.play({ repetitions: 1 });
      animationPlaying = true;
      stopAnimationClock();
      tickAnimationTime();
      setStatus(modelStatus, "Deployment animation playing.");
    });

    pauseButton?.addEventListener("click", () => {
      if (!modelViewer || !animationReady) return;
      pauseModel();
      updateAnimationTime(modelViewer.currentTime);
      setStatus(modelStatus, `Deployment animation paused at ${formatTime(modelViewer.currentTime)}.`);
    });

    restartButton?.addEventListener("click", () => {
      if (!modelViewer || !animationReady) return;
      pauseModel();
      modelViewer.currentTime = 0;
      updateAnimationTime(0);
      modelViewer.play({ repetitions: 1 });
      animationPlaying = true;
      tickAnimationTime();
      setStatus(modelStatus, "Deployment animation restarted from 00:00.");
    });

    timeline?.addEventListener("input", () => {
      if (!modelViewer || !animationReady) return;
      pauseModel();
      const requestedTime = Math.min(Number(timeline.value), Number(modelViewer.duration) || nominalDuration);
      modelViewer.currentTime = requestedTime;
      updateAnimationTime(Number(timeline.value));
    });

    timeline?.addEventListener("change", () => {
      if (!modelViewer || !animationReady) return;
      setStatus(modelStatus, `Deployment timeline positioned at ${formatTime(timeline.value)}.`);
    });

  });

  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
