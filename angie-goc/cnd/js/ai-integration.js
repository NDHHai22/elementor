let L;
const Vt = () => (L = st(), L), it = async () => (L || (L = st()), await L), st = async () => new Promise(
  (e, t) => {
    window.elementorCommon.ajax.addRequest(
      "ai_get_remote_config",
      {
        success: (n) => {
          const { jwt: o, features: r = [] } = n.config;
          e({
            jwt: o,
            features: r
          });
        },
        error: (n) => {
          console.log("remoteConfig", n), t(n);
        }
      }
    );
  }
), Ft = (e) => {
  e.style.height = "80px";
}, Ht = (e) => {
  e.style.height = "80px";
}, Bt = (e) => {
  e.style.height = "0";
}, p = (e, t) => {
  e.postMessage({
    status: "success",
    payload: t
  });
}, k = (e, t) => {
  e.postMessage({
    status: "error",
    payload: t
  });
}, _ = async (e) => {
  const t = e.origin || "https://editor-static-bucket.elementor.com", n = await L, o = new URL(e.path, t), r = o.pathname.slice(1).replace(/\//, "--") + "-" + Math.random().toString(36).substring(7);
  return new Promise((i) => {
    var T, V, R, me, pe, fe, we, ge, he;
    const s = new URL(t);
    s.pathname = o.pathname, s.pathname += ".html";
    const a = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light", c = ((pe = (me = (R = (V = (T = window.elementor) == null ? void 0 : T.config) == null ? void 0 : V.settings) == null ? void 0 : R.editorPreferences) == null ? void 0 : me.settings) == null ? void 0 : pe.ui_theme) || a;
    if (s.searchParams.append("colorScheme", c), s.searchParams.append("isRTL", (we = (fe = window.elementorCommon) == null ? void 0 : fe.config) != null && we.isRTL ? "true" : "false"), s.searchParams.append("version", (he = (ge = window.elementorCommon) == null ? void 0 : ge.config) == null ? void 0 : he.version), s.searchParams.append("instanceId", r), s.searchParams.append("origin", window.location.origin), window.location.hostname === "localhost" && window.location.search.includes("debug_error")) {
      const C = new URLSearchParams(window.location.search).get("debug_error");
      C && s.searchParams.append("debug_error", C);
    }
    o.searchParams.forEach((C, E) => {
      s.searchParams.set(E, C);
    }), s.searchParams.set("ver", (/* @__PURE__ */ new Date()).getTime().toString());
    const l = e.parent || document, d = l.createElement("iframe");
    function w(C) {
      var F, P, M, H, b, K, D, Ce, ye, be, Se, ve, xe, Ee, Ie, Ae, Le, _e, Te, ke;
      const E = window.elementor ? (F = window.elementor.config) == null ? void 0 : F.user : (M = (P = window.elementorAdmin) == null ? void 0 : P.config) == null ? void 0 : M.user, v = (Ce = (b = (H = window.elementorFrontend) == null ? void 0 : H.elements) == null ? void 0 : b.$window[0]) == null ? void 0 : Ce.getComputedStyle((D = (K = window.elementorFrontend) == null ? void 0 : K.elements) == null ? void 0 : D.$body[0]);
      (ke = d.contentWindow) == null || ke.postMessage({
        type: "referrer/info",
        instanceId: C,
        info: {
          page: {
            url: window.location.href,
            editorSessionId: window.EDITOR_SESSION_ID,
            elementorAiCurrentContext: window.elementorAiCurrentContext,
            bodyStyle: {
              backgroundColor: v == null ? void 0 : v.backgroundColor,
              backgroundImage: v == null ? void 0 : v.backgroundImage
            }
          },
          authToken: n == null ? void 0 : n.jwt,
          siteKey: e.siteKey,
          products: {
            core: {
              version: (be = (ye = window.elementor) == null ? void 0 : ye.config) == null ? void 0 : be.version
            },
            pro: {
              isPro: (ve = (Se = window.elementor) == null ? void 0 : Se.config) == null ? void 0 : ve.isPro,
              accessLevel: (Ee = (xe = window.elementor) == null ? void 0 : xe.config) == null ? void 0 : Ee.accessLevel,
              accessTier: (Ae = (Ie = window.elementor) == null ? void 0 : Ie.config) == null ? void 0 : Ae.accessTier
            },
            ai: {
              config: window.ElementorAiConfig
            }
          },
          user: {
            isAdmin: (Te = (_e = (Le = window.elementor) == null ? void 0 : Le.config) == null ? void 0 : _e.user) == null ? void 0 : Te.is_administrator,
            introduction: E == null ? void 0 : E.introduction
          }
        }
      }, s.origin);
    }
    const m = async (C) => {
      if (C.origin === s.origin)
        switch (C.data.type) {
          case "ai_request":
            const { endpoint: E, data: v, immediately: F, signal: P } = C.data.payload;
            Object.keys(v).length && (v.context = window.elementorAiCurrentContext), v.editor_session_id = window.EDITOR_SESSION_ID;
            const M = await window.elementorCommon.ajax.addRequest(
              E,
              {
                success: (b) => {
                  p(C.ports[0], b);
                },
                error: (b) => {
                  const D = {
                    error: b.error || b.responseText || b.statusText || b.message || (b.toString() === "[object Object]" ? "Unknown error" : b.toString())
                  };
                  b.extra_data && Object.assign(D, b), k(C.ports[0], D);
                },
                data: v
              },
              F
            );
            P && M && "jqXhr" in M && P && P.addEventListener("abort", M.jqXhr.abort);
            break;
          case "get/referrer/info":
            w(C.data.payload.instanceId);
            break;
          case "auth-token/refresh":
            const H = await Vt();
            C.ports[0].postMessage({
              status: "success",
              payload: {
                jwt: H.jwt
              }
            });
            break;
          case "element-selector/loaded":
            i({
              iframe: d,
              iframeUrlObject: s
            });
            break;
          case "element-selector/close":
            (C.data.payload.instanceId === r || !C.data.payload.instanceId) && (d.remove(), window.removeEventListener("message", m));
            break;
        }
    }, h = {
      "background-color": "transparent",
      "color-scheme": "normal",
      ...e.css
    };
    window.addEventListener("message", m), d.setAttribute("src", s.href), d.id = "editor-static-iframe", d.setAttribute("frameborder", "0"), d.setAttribute("scrolling", "no"), d.setAttribute("allow", "clipboard-read; clipboard-write"), d.setAttribute("style", Object.entries(h).map(([C, E]) => `${C}: ${E}`).join("; ")), d.setAttribute("allow", "clipboard-write; clipboard-read"), e.insertCallback ? e.insertCallback(d) : l.body.appendChild(d);
  });
}, Wt = `
<g id="AI context">
<path style="fill: currentColor" id="Union" fill-rule="evenodd" clip-rule="evenodd" d="M3 4.59524C3 3.69159 3.69281 3 4.5 3H19.5C20.3072 3 21 3.69159 21 4.59524V5H3V4.59524ZM2 5.5V4.59524C2 3.18365 3.09719 2 4.5 2H19.5C20.9028 2 22 3.18365 22 4.59524V5.5V19.4048C22 20.8163 20.9028 22 19.5 22H4.5C3.09719 22 2 20.8163 2 19.4048V5.5ZM21 6V19.4048C21 20.3084 20.3072 21 19.5 21H4.5C3.69281 21 3 20.3084 3 19.4048V6H21Z" fill="#525962"/>
<path id="Fill 632" fill-rule="evenodd" clip-rule="evenodd" d="M5 4C5 4.276 4.776 4.5 4.5 4.5C4.224 4.5 4 4.276 4 4C4 3.724 4.224 3.5 4.5 3.5C4.776 3.5 5 3.724 5 4" fill="#525962"/>
<path id="Fill 634" fill-rule="evenodd" clip-rule="evenodd" d="M7 4C7 4.276 6.776 4.5 6.5 4.5C6.224 4.5 6 4.276 6 4C6 3.724 6.224 3.5 6.5 3.5C6.776 3.5 7 3.724 7 4" fill="#525962"/>
<path id="Fill 636" fill-rule="evenodd" clip-rule="evenodd" d="M9 4C9 4.276 8.776 4.5 8.5 4.5C8.224 4.5 8 4.276 8 4C8 3.724 8.224 3.5 8.5 3.5C8.776 3.5 9 3.724 9 4" fill="#525962"/>
<path style="fill: currentColor" id="Union_2" fill-rule="evenodd" clip-rule="evenodd" d="M10.5 7.86667C10.3224 7.86667 10.152 7.93722 10.0265 8.06282C9.90086 8.18841 9.8303 8.35875 9.8303 8.53636V8.63185C9.82926 8.89383 9.75163 9.14979 9.60697 9.36821C9.46232 9.58664 9.25696 9.758 9.01616 9.8612C8.97589 9.87846 8.93331 9.88948 8.8899 9.89396C8.66772 9.97414 8.42774 9.9945 8.19424 9.95217C7.93014 9.90428 7.68644 9.77837 7.49456 9.59068L7.49114 9.58734L7.45807 9.55423C7.39588 9.49197 7.32184 9.4424 7.24054 9.4087C7.15924 9.37499 7.0721 9.35765 6.98409 9.35765C6.89608 9.35765 6.80894 9.37499 6.72764 9.4087C6.64634 9.4424 6.57248 9.49179 6.51028 9.55406C6.44801 9.61626 6.39828 9.69046 6.36458 9.77176C6.33087 9.85306 6.31353 9.9402 6.31353 10.0282C6.31353 10.1162 6.33087 10.2034 6.36458 10.2847C6.39828 10.366 6.44767 10.4398 6.50994 10.502L6.54658 10.5387C6.73427 10.7305 6.86016 10.9743 6.90804 11.2384C6.95512 11.498 6.92468 11.7656 6.82069 12.0079C6.72677 12.2554 6.56173 12.4698 6.3462 12.624C6.12696 12.7808 5.86561 12.868 5.59613 12.8743L5.586 12.8745L5.53636 12.8744C5.35875 12.8744 5.18841 12.945 5.06282 13.0706C4.93722 13.1962 4.86667 13.3665 4.86667 13.5441C4.86667 13.7217 4.93722 13.8921 5.06282 14.0177C5.18841 14.1433 5.35875 14.2138 5.53636 14.2138H5.63185C5.89383 14.2149 6.14979 14.2925 6.36821 14.4371C6.58599 14.5814 6.75699 14.786 6.86029 15.0258C6.96791 15.2708 6.99991 15.5424 6.95217 15.8058C6.90428 16.0699 6.77837 16.3136 6.59068 16.5054L6.58734 16.5089L6.55423 16.5419C6.49196 16.6041 6.4424 16.6782 6.4087 16.7595C6.37499 16.8408 6.35765 16.9279 6.35765 17.0159C6.35765 17.1039 6.37499 17.1911 6.4087 17.2724C6.4424 17.3537 6.4918 17.4275 6.55406 17.4897C6.61626 17.552 6.69046 17.6017 6.77176 17.6354C6.85306 17.6691 6.9402 17.6865 7.02821 17.6865C7.11622 17.6865 7.20337 17.6691 7.28467 17.6354C7.36597 17.6017 7.43983 17.5523 7.50202 17.4901L7.53866 17.4534C7.73054 17.2657 7.97426 17.1398 8.23836 17.092C8.49797 17.0449 8.76559 17.0753 9.00786 17.1793C9.25542 17.2732 9.46981 17.4383 9.62397 17.6538C9.78078 17.873 9.868 18.1344 9.87431 18.4039L9.87454 18.414L9.87442 18.4636C9.87442 18.6413 9.94498 18.8116 10.0706 18.9372C10.1962 19.0628 10.3665 19.1333 10.5441 19.1333C10.7217 19.1333 10.8921 19.0628 11.0177 18.9372C11.1433 18.8116 11.2138 18.6413 11.2138 18.4636V18.3699L11.2138 18.3682C11.2149 18.1062 11.2925 17.8502 11.4371 17.6318C11.5814 17.414 11.786 17.243 12.0259 17.1397C12.2709 17.0321 12.5424 17.0001 12.8058 17.0478C13.0699 17.0957 13.3136 17.2216 13.5054 17.4093L13.5089 17.4127L13.5419 17.4458C13.6041 17.508 13.6782 17.5576 13.7595 17.5913C13.8408 17.625 13.9279 17.6424 14.0159 17.6424C14.1039 17.6424 14.1911 17.625 14.2724 17.5913C14.3537 17.5576 14.4275 17.5082 14.4897 17.4459C14.552 17.3837 14.6017 17.3095 14.6354 17.2282C14.6691 17.1469 14.6865 17.0598 14.6865 16.9718C14.6865 16.8838 14.6691 16.7966 14.6354 16.7153C14.6017 16.634 14.5523 16.5602 14.4901 16.498L14.4534 16.4613C14.2657 16.2695 14.1398 16.0257 14.092 15.7616C14.0442 15.4983 14.0762 15.2267 14.1838 14.9817C14.2871 14.7419 14.4581 14.5373 14.6759 14.393C14.8943 14.2484 15.1503 14.1707 15.4123 14.1697L15.414 14.1697L15.4636 14.1697C15.6413 14.1697 15.8116 14.0991 15.9372 13.9735C16.0628 13.848 16.1333 13.6776 16.1333 13.5C16.1333 13.3224 16.0628 13.152 15.9372 13.0265C15.8116 12.9009 15.6413 12.8303 15.4636 12.8303H15.3699L15.3682 12.8303C15.1062 12.8293 14.8502 12.7516 14.6318 12.607C14.4134 12.4623 14.242 12.257 14.1388 12.0162C14.1215 11.9759 14.1105 11.9333 14.106 11.8899C14.0259 11.6677 14.0055 11.4277 14.0478 11.1942C14.0957 10.9301 14.2216 10.6864 14.4093 10.4946L14.4127 10.4911L14.4458 10.4581C14.508 10.3959 14.5576 10.3218 14.5913 10.2405C14.625 10.1592 14.6424 10.0721 14.6424 9.98409C14.6424 9.89608 14.625 9.80894 14.5913 9.72764C14.5576 9.64634 14.5082 9.57248 14.4459 9.51028C14.3837 9.44801 14.3095 9.39828 14.2282 9.36458C14.1469 9.33087 14.0598 9.31353 13.9718 9.31353C13.8838 9.31353 13.7966 9.33087 13.7153 9.36458C13.634 9.39828 13.5602 9.44767 13.498 9.50994L13.4613 9.54658C13.2695 9.73427 13.0257 9.86016 12.7616 9.90804C12.4983 9.95579 12.2267 9.92379 11.9817 9.81616C11.7418 9.71286 11.5372 9.54187 11.393 9.32409C11.2484 9.10566 11.1707 8.84971 11.1697 8.58773L11.1697 8.586V8.53636C11.1697 8.35875 11.0991 8.18841 10.9735 8.06282C10.848 7.93722 10.6776 7.86667 10.5 7.86667ZM9.41363 7.44999C9.70175 7.16187 10.0925 7 10.5 7C10.9075 7 11.2982 7.16187 11.5864 7.44999C11.8745 7.73811 12.0364 8.12889 12.0364 8.53636V8.58497C12.0369 8.67769 12.0644 8.76825 12.1156 8.84556C12.1669 8.92307 12.2398 8.98387 12.3252 9.02049L12.3295 9.02232C12.4167 9.06078 12.5133 9.07227 12.607 9.05528C12.7001 9.03841 12.786 8.99424 12.8538 8.92842L12.8848 8.89745C13.0275 8.75469 13.197 8.64126 13.3835 8.56397C13.57 8.48666 13.7699 8.44686 13.9718 8.44686C14.1737 8.44686 14.3736 8.48666 14.5601 8.56397C14.7465 8.64123 14.9158 8.75443 15.0584 8.89711C15.2013 9.0398 15.3146 9.20924 15.3919 9.39576C15.4692 9.58227 15.509 9.78219 15.509 9.98409C15.509 10.186 15.4692 10.3859 15.3919 10.5724C15.3146 10.7589 15.2013 10.9284 15.0584 11.0711L15.0275 11.102C14.9616 11.1699 14.9175 11.2558 14.9006 11.3489C14.8836 11.4426 14.8951 11.5392 14.9335 11.6264C14.9485 11.6603 14.959 11.696 14.9649 11.7325C15.0013 11.7931 15.0509 11.8451 15.1103 11.8844C15.1876 11.9356 15.2781 11.9631 15.3708 11.9636H15.4636C15.8711 11.9636 16.2619 12.1255 16.55 12.4136C16.8381 12.7018 17 13.0925 17 13.5C17 13.9075 16.8381 14.2982 16.55 14.5864C16.2619 14.8745 15.8711 15.0364 15.4636 15.0364H15.415C15.3223 15.0369 15.2318 15.0644 15.1544 15.1156C15.0769 15.1669 15.0161 15.2398 14.9795 15.3252L14.9777 15.3295C14.9392 15.4167 14.9277 15.5133 14.9447 15.607C14.9616 15.7001 15.0058 15.786 15.0716 15.8539L15.1025 15.8848C15.2454 16.0275 15.3587 16.1969 15.436 16.3835C15.5133 16.57 15.5531 16.7699 15.5531 16.9718C15.5531 17.1737 15.5133 17.3736 15.436 17.5601C15.3587 17.7466 15.2455 17.9159 15.1027 18.0586C14.9601 18.2014 14.7907 18.3146 14.6042 18.3919C14.4177 18.4692 14.2178 18.509 14.0159 18.509C13.814 18.509 13.6141 18.4692 13.4276 18.3919C13.2411 18.3146 13.0716 18.2013 12.9289 18.0584L12.898 18.0275C12.8301 17.9616 12.7442 17.9175 12.6511 17.9006C12.5574 17.8836 12.4608 17.8951 12.3736 17.9335L12.3694 17.9354C12.2839 17.972 12.2111 18.0328 12.1597 18.1103C12.1085 18.1876 12.081 18.2782 12.0805 18.3709V18.4636C12.0805 18.8711 11.9186 19.2619 11.6305 19.55C11.3424 19.8381 10.9516 20 10.5441 20C10.1367 20 9.74587 19.8381 9.45775 19.55C9.16962 19.2619 9.00776 18.8711 9.00776 18.4636V18.4199C9.00471 18.3258 8.97386 18.2346 8.91905 18.158C8.8634 18.0802 8.78564 18.0209 8.69588 17.9879C8.68731 17.9848 8.67884 17.9813 8.67049 17.9777C8.58336 17.9392 8.4867 17.9277 8.39299 17.9447C8.29993 17.9616 8.21401 18.0058 8.14615 18.0716L8.11519 18.1025C7.97254 18.2453 7.80299 18.3587 7.61655 18.436C7.43004 18.5133 7.23011 18.5531 7.02821 18.5531C6.82631 18.5531 6.62639 18.5133 6.43988 18.436C6.25337 18.3587 6.08392 18.2454 5.94123 18.1025C5.79855 17.9599 5.68535 17.7906 5.60809 17.6042C5.53078 17.4177 5.49098 17.2178 5.49098 17.0159C5.49098 16.814 5.53078 16.6141 5.60809 16.4276C5.68538 16.2411 5.79864 16.0718 5.94141 15.9291L5.97254 15.898C6.03836 15.8301 6.08253 15.7442 6.0994 15.6511C6.1164 15.5574 6.10492 15.4608 6.06647 15.3736L6.06459 15.3694C6.02797 15.2839 5.96719 15.2111 5.88968 15.1597C5.81237 15.1085 5.72181 15.081 5.62909 15.0805H5.53636C5.12889 15.0805 4.73811 14.9186 4.44999 14.6305C4.16187 14.3424 4 13.9516 4 13.5441C4 13.1367 4.16187 12.7459 4.44999 12.4577C4.73811 12.1696 5.12889 12.0078 5.53636 12.0078H5.58012C5.67424 12.0047 5.76538 11.9739 5.84202 11.919C5.91982 11.8634 5.97907 11.7856 6.01209 11.6959C6.01524 11.6873 6.01866 11.6788 6.02235 11.6705C6.0608 11.5834 6.07227 11.4867 6.05528 11.393C6.03841 11.2999 5.99424 11.214 5.92842 11.1462L5.89745 11.1152C5.75469 10.9725 5.64126 10.803 5.56397 10.6165C5.48666 10.43 5.44686 10.2301 5.44686 10.0282C5.44686 9.82631 5.48666 9.62639 5.56397 9.43988C5.64126 9.25344 5.75452 9.08406 5.89728 8.94141C6.03994 8.79864 6.20932 8.68538 6.39576 8.60809C6.58227 8.53078 6.78219 8.49098 6.98409 8.49098C7.18599 8.49098 7.38591 8.53078 7.57243 8.60809C7.75886 8.68538 7.92825 8.79864 8.0709 8.94141L8.10203 8.97254C8.16989 9.03836 8.25581 9.08253 8.34887 9.0994C8.44258 9.1164 8.53924 9.10492 8.62637 9.06647C8.66033 9.05148 8.696 9.04095 8.73247 9.03508C8.79307 8.99867 8.84506 8.94908 8.8844 8.88968C8.93558 8.81239 8.96312 8.72186 8.96364 8.62917V8.53636C8.96364 8.12889 9.1255 7.73811 9.41363 7.44999ZM10.4995 12.2787C9.82504 12.2787 9.27829 12.8255 9.27829 13.4999C9.27829 14.1744 9.82504 14.7211 10.4995 14.7211C11.174 14.7211 11.7207 14.1744 11.7207 13.4999C11.7207 12.8255 11.174 12.2787 10.4995 12.2787ZM8.41162 13.4999C8.41162 12.3468 9.3464 11.4121 10.4995 11.4121C11.6526 11.4121 12.5874 12.3468 12.5874 13.4999C12.5874 14.653 11.6526 15.5878 10.4995 15.5878C9.3464 15.5878 8.41162 14.653 8.41162 13.4999ZM18.5455 7.51735C18.5455 7.23162 18.3012 7 18 7C17.6988 7 17.4545 7.23162 17.4545 7.51735C17.4545 7.74603 17.3588 7.96534 17.1883 8.12705C17.0178 8.28875 16.7866 8.37959 16.5455 8.37959C16.2442 8.37959 16 8.61122 16 8.89694C16 9.18266 16.2442 9.41429 16.5455 9.41429C16.7866 9.41429 17.0178 9.50513 17.1883 9.66683C17.3588 9.82853 17.4545 10.0478 17.4545 10.2765C17.4545 10.5623 17.6988 10.7939 18 10.7939C18.3012 10.7939 18.5455 10.5623 18.5455 10.2765C18.5455 10.0478 18.6412 9.82853 18.8117 9.66683C18.9822 9.50513 19.2134 9.41429 19.4545 9.41429C19.7558 9.41429 20 9.18266 20 8.89694C20 8.61122 19.7558 8.37959 19.4545 8.37959C19.2134 8.37959 18.9822 8.28875 18.8117 8.12705C18.6412 7.96534 18.5455 7.74603 18.5455 7.51735ZM17.9597 8.85869C17.9733 8.84573 17.9868 8.8326 18 8.81931C18.0132 8.8326 18.0267 8.84573 18.0403 8.85869C18.054 8.87164 18.0678 8.8844 18.0818 8.89694C18.0678 8.90948 18.054 8.92223 18.0403 8.93519C18.0267 8.94815 18.0132 8.96128 18 8.97457C17.9868 8.96128 17.9733 8.94815 17.9597 8.93519C17.946 8.92223 17.9322 8.90948 17.9182 8.89694C17.9322 8.8844 17.946 8.87164 17.9597 8.85869ZM18.5455 16.7235C18.5455 16.4377 18.3012 16.2061 18 16.2061C17.6988 16.2061 17.4545 16.4377 17.4545 16.7235C17.4545 16.9522 17.3588 17.1715 17.1883 17.3332C17.0178 17.4949 16.7866 17.5857 16.5455 17.5857C16.2442 17.5857 16 17.8173 16 18.1031C16 18.3888 16.2442 18.6204 16.5455 18.6204C16.7866 18.6204 17.0178 18.7113 17.1883 18.873C17.3588 19.0347 17.4545 19.254 17.4545 19.4827C17.4545 19.7684 17.6988 20 18 20C18.3012 20 18.5455 19.7684 18.5455 19.4827C18.5455 19.254 18.6412 19.0347 18.8117 18.873C18.9822 18.7113 19.2134 18.6204 19.4545 18.6204C19.7558 18.6204 20 18.3888 20 18.1031C20 17.8173 19.7558 17.5857 19.4545 17.5857C19.2134 17.5857 18.9822 17.4949 18.8117 17.3332C18.6412 17.1715 18.5455 16.9522 18.5455 16.7235ZM17.9597 18.0648C17.9733 18.0518 17.9868 18.0387 18 18.0254C18.0132 18.0387 18.0267 18.0518 18.0403 18.0648C18.054 18.0778 18.0678 18.0905 18.0819 18.1031C18.0678 18.1156 18.054 18.1284 18.0403 18.1413C18.0267 18.1543 18.0132 18.1674 18 18.1807C17.9868 18.1674 17.9733 18.1543 17.9597 18.1413C17.946 18.1284 17.9322 18.1156 17.9182 18.1031C17.9322 18.0905 17.946 18.0778 17.9597 18.0648Z"/>
</g>
`, U = document.createElementNS("http://www.w3.org/2000/svg", "svg");
U.setAttribute("width", "24");
U.setAttribute("height", "24");
U.setAttribute("viewBox", "0 0 24 24");
U.innerHTML = Wt;
const Nt = (e, t) => {
  if (t === "panel/global/menu") {
    const n = window.elementor.getPanelView().getPages("kit_menu").view.getGroups("settings").find({ name: "settings" }).get("items");
    let o = n.findIndex((i) => i.name === "ai-context");
    if (o === -1) {
      const i = {
        name: "ai-context",
        icon: "eicon-tools",
        title: "AI Context",
        callback: () => window.$e.run("ai-integration/open-brand-voice")
      }, s = n.findIndex((a) => a.name === "settings-site-identity");
      o = s >= 0 ? s + 1 : n.length, n.splice(o, 0, i);
    }
    new MutationObserver((i, s) => {
      var c;
      const a = document.querySelector(".elementor-panel-menu-item-ai-context .elementor-panel-menu-item-icon i.eicon-tools");
      a && ((c = a.parentNode) == null || c.replaceChild(U, a), s.disconnect());
    }).observe(document.body, {
      childList: !0,
      subtree: !0
    });
  }
}, qt = () => {
  window.$e.components.get("ai-integration").registerCommand("open-brand-voice", () => {
    _({
      path: "/brand-voice",
      css: {
        width: "100%",
        height: "100%",
        position: "fixed",
        bottom: 0,
        right: 0,
        "z-index": 999999
      }
    });
  }), window.$e.routes.on("run:before", Nt);
}, at = (e, t) => {
  var n;
  console.log("asking copilot to stop"), (n = e.contentWindow) == null || n.postMessage({
    type: "copilot/next-layout/stop",
    payload: {
      trigger: t
    }
  }, new URL(e.src).origin), gt();
}, zt = [
  "ai-integration/open-text-to-elementor",
  "container-converter/convert-all",
  "document/elements/create",
  "document/elements/delete",
  "document/elements/empty",
  "document/elements/settings",
  "document/ui/delete",
  "editor/documents/close",
  "editor/documents/preview",
  "editor/documents/switch",
  "library/open",
  "panel/close",
  "panel/exit",
  "panel/global/close",
  "panel/global/open",
  "panel/history/actions/do",
  "panel/history/actions/redo",
  "panel/history/actions/undo"
], Gt = [
  "library/preview",
  "library/save-template",
  "library/templates/blocks",
  "library/templates/my-templates",
  "library/templates/pages",
  "panel/history/actions",
  "panel/history/revisions"
], j = {
  isEnabled: !1,
  timeoutId: null,
  dropHoverTimeoutId: void 0,
  isWaitingForUser: !0,
  isRunning: !1,
  isUserHoverDropArea: !1,
  listeners: [],
  lastSessionEndedTime: 0
}, Kt = (e) => ["page", "wp-page", "wp-post"].includes(e.config.type), ct = () => {
  j.isEnabled = !1, j.listeners.forEach((e) => e());
}, Yt = 0.2126, Zt = 0.7152, Xt = 0.0722, Qt = 2.4, Jt = 4.5;
function Pe(e) {
  e.length === 4 && (e = en(e));
  const n = e.replace(/#|0x/g, ""), o = parseInt(n.slice(6, 8), 16) / 255;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
    opacity: o
  };
}
function en(e) {
  return e.split("").map((t) => t + t).join("");
}
const Me = (e, t) => {
  const n = e.opacity, o = 1 - n;
  return {
    r: Math.round(e.r * n + t.r * o),
    g: Math.round(e.g * n + t.g * o),
    b: Math.round(e.b * n + t.b * o)
  };
}, Oe = (e) => {
  const [t, n, o, r] = e.replace(/rgba?\(|\)/g, "").split(",").map((i, s) => s === 3 ? parseFloat(i) : parseInt(i, 10));
  return { r: t, g: n, b: o, opacity: isNaN(r) ? 1 : r };
}, ee = (e, t) => {
  let n = e.startsWith("#") ? Pe(e) : Oe(e), o = t.startsWith("#") ? Pe(t) : Oe(t);
  n.opacity < 1 && (n = Me(n, o)), o.opacity < 1 && (o = Me(o, n));
  const r = (a) => {
    const c = [a.r, a.g, a.b].map((l) => (l /= 255, l <= 0.03928 ? l / 12.92 : Math.pow((l + 0.055) / 1.055, Qt)));
    return c[0] * Yt + c[1] * Zt + c[2] * Xt;
  }, i = r(n), s = r(o);
  return Math.round((Math.max(i, s) + 0.05) / (Math.min(i, s) + 0.05));
};
let te = {};
const tn = async () => {
  te = (await window.$e.data.get("globals/colors")).data;
}, nn = (e, t) => {
  const n = t.map((o) => ({
    ...o,
    contrast: ee(e, o.value)
  })).sort((o, r) => r.contrast - o.contrast);
  return n[0].contrast >= Jt ? n[0].id : "";
}, on = (e, t) => {
  const n = nn(e, t);
  if (n)
    return {
      type: "global",
      color: n
    };
  const o = ee("#FFFFFF", e), r = ee("#000000", e);
  return {
    type: "fallback",
    color: o > r ? "#FFFFFF" : "#000000"
  };
}, B = {
  context: {}
}, rn = async (e = !0) => {
  if (e && Object.keys(B.context).length)
    return B.context;
  try {
    const n = await (await fetch(window.wpApiSettings.root)).json();
    return B.context = {
      name: n.name,
      tagline: n.description,
      homeUrl: n.home
    }, B.context;
  } catch (t) {
    return console.error(t), {
      name: "",
      tagline: "",
      homeUrl: "",
      error: t
    };
  }
}, lt = async () => {
  var t;
  return {
    ...await rn(),
    wpVersion: (t = window.angieConfig) == null ? void 0 : t.wpVersion,
    siteLang: window.document.documentElement.lang,
    docTitle: window.document.title
  };
}, dt = () => {
  const e = window.elementor.documents.getCurrent();
  return {
    title: e.config.settings.settings.post_title,
    url: window.location.href,
    type: e.config.type,
    depth: 1
  };
}, sn = (e, t, n) => {
  e.model.get("settings").set(t, n), e.render();
}, Re = (e, t) => window.$e.components.get("document").utils.findViewRecursive(e, "id", t, !1)[0] || null, an = (e) => {
  let t, n;
  if (e.includes(":"))
    [t, n] = e.split(":");
  else {
    const [o, ...r] = e.split("_");
    t = o, n = r.join("_");
  }
  return { id: t, setting: n };
}, cn = (e, t) => {
  const n = {};
  for (const { textId: o, newText: r } of t) {
    if (!o || !r)
      continue;
    const { id: i, setting: s } = an(o);
    if (s.includes(".")) {
      const [c, l, d] = s.split(".");
      n[i] = n[i] || {}, n[i][c] = n[i][c] || [], n[i][c][parseInt(l)] = {
        settingKey: d,
        newText: r
      };
      continue;
    }
    const a = Re(e, i);
    a && sn(a, s, r);
  }
  for (const [o, r] of Object.entries(n)) {
    const i = Re(e, o);
    if (i) {
      for (const [s, a] of Object.entries(r)) {
        const l = i.model.get("settings").get(s);
        if (l)
          for (const [d, { settingKey: w, newText: m }] of Object.entries(a)) {
            const h = l.at(parseInt(d));
            h && h.set(w, m);
          }
      }
      i.container.render();
    }
  }
}, De = (e, t) => e.map((n) => {
  var o, r;
  return (r = (o = n.get("settings")) == null ? void 0 : o.get("ai")) == null ? void 0 : r[t];
}).filter((n) => n).map((n) => parseInt(n)), ln = async (e) => {
  const t = ut(e);
  for (const n of t)
    await window.$e.run("document/elements/create", {
      container: window.elementor.getPreviewContainer(),
      model: n,
      options: {
        edit: !0,
        scrollIntoView: t.indexOf(n) === 0
      }
    });
}, dn = async (e) => ({
  size: {
    width: e.width
  },
  prevBlockIds: De(window.elementor.elements, "blockId"),
  prevBaseTemplateIds: De(window.elementor.elements, "baseTemplateId"),
  context: {
    editorSessionId: e.editorSessionId,
    prevLayout: e.currentHTML,
    website: await lt(),
    page: dt(),
    supportedFeatures: window.elementorCommon.config.experimentalFeatures
  }
}), ut = (e) => {
  const t = window.elementor.createBackboneElementsCollection(e), n = window.elementor.createBackboneElementsModel(t), o = async (r) => {
    const i = r.get("settings");
    if (i) {
      Object.values(i.controls).filter((m) => m.type === "color").forEach((m) => {
        i.set(m.name, m.default);
      }), Object.values(i.controls).filter((m) => m.type === "choose" && m.name.endsWith("background")).forEach((m) => {
        i.set(m.name, m.default);
      });
      const l = Object.values(i.controls).filter((m) => m.name.endsWith("font_size")), d = l.map((m) => i.get(m.name));
      if (Object.values(i.controls).filter((m) => m.groupType === "typography").forEach((m) => {
        i.set(m.name, m.default);
      }), l.forEach((m, h) => {
        i.set(m.name, d[h]), i.set(m.name.replace("_font_size", "_typography"), "custom");
      }), i.attributes.hasOwnProperty("button_text_color")) {
        const m = on(te.accent.value, Object.values(te));
        if (m.type === "global") {
          const h = i.get("__globals__") || {};
          h.button_text_color = `globals/colors?id=${m.color}`, i.set("__globals__", h);
        } else
          i.set("button_text_color", m.color);
      }
    }
    const s = r.get("elements");
    s && s.forEach((a) => {
      o(a);
    });
  };
  return o(n), n.get("elements").toJSON();
}, un = (e, t, n) => {
  const o = window.elementor.$previewContents[0], r = (n == null ? void 0 : n.previewAreaId) || "elementor-copilot-preview", i = o.querySelector(`#${r}-wrapper`) || o.createElement("div"), s = i.querySelector(`#${r}`) || o.createElement("div");
  s.id = r, s.classList.add("elementor-editor-preview"), t.jsonWithTexts || (s.style.opacity = "0.32", i.classList.add("elementor-copilot-preview-loading")), i.id = `${r}-wrapper`, i.style.border = "2px dashed #eee", i.appendChild(s), o.body.appendChild(i), n != null && n.adjustPosition ? n.adjustPosition(i) : e == null || e.insertAdjacentElement("afterend", i);
  const a = o.createElement("style");
  if (a.innerHTML = `
		#elementor-copilot-preview {
			pointer-events: none;
		}

		#elementor-copilot-preview .elementor-inline-editing {
			transition: color 0.5s;
		}

		.elementor-copilot-preview-loading .elementor-inline-editing {
			color: transparent !important;
			position: relative;
		}
	`, a.innerHTML += `
	#editor-static-iframe#editor-static-iframe {
		pointer-events: all !important;
		position: absolute;
	}`, !window.elementor.createBackboneElementsCollection)
    return i.style.marginTop = "30px", s.style.opacity = "0.8", s.innerHTML = "Can't render the preview, Please update your Elementor to the latest version (>=3.20-beta2).", {
      previewAreaWrapper: i,
      elementsModel: null,
      previewView: null
    };
  window.elementor.$previewContents[0].head.appendChild(a);
  const c = t.jsonWithTexts || t.json, l = ut(c), d = window.elementor.createBackboneElementsCollection(l), w = window.elementor.createBackboneElementsModel(d), m = window.elementor.createPreviewView(s, w, {
    allowEdit: !1
  });
  return window.elementor.renderPreview(m), parseInt(getComputedStyle(s).height) < 200 && (i.style.marginTop = "0"), {
    previewAreaWrapper: i,
    elementsModel: w,
    previewView: m
  };
}, ne = [], mn = (e, t) => {
  const n = `command: ${e}`;
  zt.includes(e) && (at(t, n), mt());
}, pn = (e, t) => {
  const n = `route: ${e}`;
  Gt.includes(e) && (at(t, n), mt());
}, fn = (e) => {
  const t = (o, r) => {
    mn(r, e);
  }, n = (o, r) => {
    pn(r, e);
  };
  window.$e.commands.on("run:after", t), window.$e.routes.on("run:after", n), ne.push(() => {
    window.$e.commands.off("run:after", t), window.$e.routes.off("run:after", n);
  });
}, mt = () => {
  ne.forEach((e) => e()), ne.length = 0;
}, oe = async (e, t, n) => {
  if (!e.iframe)
    return null;
  const { iframe: o } = await _({
    path: `upgrade-notice?reason=${t}&title=${n}`,
    css: {
      position: "fixed",
      height: "220px",
      width: "300px",
      top: e.iframe.getBoundingClientRect().bottom + "px",
      left: e.iframe.getBoundingClientRect().left + e.iframe.getBoundingClientRect().width / 2 - 150 + "px",
      "border-radius": "5px",
      "z-index": 999999999
    }
  });
  return e.noticeIframe = o, o;
}, wn = window.EDITOR_SESSION_ID || "CNL-editor-session-" + Math.random().toString(16).substr(2, 7), u = {
  started: !1,
  iframe: null,
  isOpen: !1,
  isHidden: !1,
  channel: null,
  iframeUrlObject: null,
  elementsModel: null,
  previewView: null,
  previewAreaWrapper: null,
  editorSessionId: wn
}, pt = async () => {
  const e = await ht();
  return u.isOpen = !0, e;
}, gn = (e, t) => {
  const n = e && Kt(e);
  return n && !t ? "start" : !n && t ? "stop" : "";
}, hn = async () => {
  const e = window.elementor.documents.getCurrent(), t = u.isOpen;
  switch (gn(e, t)) {
    case "start":
      await pt();
      break;
    case "stop":
      ct(), u.isOpen = !1;
      break;
  }
}, Cn = (e = () => {
}) => {
  window.$e.commands.on("run:after", (t, n) => {
    n === "editor/documents/close" && (u.isOpen = !1, e());
  });
}, ft = async (e) => {
  console.log("copilot enabled");
  const t = await pt();
  await yt(t, {
    status: Ct.ON,
    prevStatus: e.prevStatus
  });
}, wt = async (e) => {
  var o, r, i;
  console.log("copilot disabled"), ct();
  const t = await ht(), n = await yt(t, e);
  return t.remove(), (o = u.iframe) == null || o.remove(), u.iframe = null, u.isOpen = !1, u.elementsModel = null, (r = u.previewView) == null || r.destroy(), (i = u.previewAreaWrapper) == null || i.remove(), n;
}, yn = async (e) => {
  var t, n, o;
  switch (e.data.type) {
    case "copilot/next-layout/replace-text":
      cn(u.previewView.children, e.data.payload.json), (t = u.previewAreaWrapper) == null || t.classList.remove("elementor-copilot-preview-loading"), p(e.ports[0]);
      break;
    case "copilot/next-layout/show-default-text":
      (n = u.previewAreaWrapper) == null || n.classList.remove("elementor-copilot-preview-loading"), p(e.ports[0]);
      break;
    case "copilot/next-layout/get-layout-context":
      fn(u.iframe);
      const i = window.elementor.$previewContents[0].querySelector(".elementor-edit-area-active"), s = i == null ? void 0 : i.cloneNode(!0);
      s.querySelectorAll(".elementor-editor-element-settings, #elementor-add-new-section, .elementor-add-section-inner").forEach((d) => d.remove());
      const a = await dn({
        width: i.clientWidth,
        currentHTML: s.innerHTML,
        editorSessionId: u.editorSessionId
      });
      window.location.search.includes("copilot-block-id") && (a.debugId = new URLSearchParams(window.location.search).get("copilot-block-id")), tn(), p(e.ports[0], a);
      break;
    case "copilot/next-layout/set-preview":
      const c = un(u.iframe, e.data.payload);
      u.previewView = c.previewView, u.previewAreaWrapper = c.previewAreaWrapper, u.elementsModel = c.elementsModel, p(e.ports[0]);
      break;
    case "copilot/next-layout/reset-preview":
      await gt(), p(e.ports[0]);
      break;
    case "copilot/next-layout/insert":
      await ln(e.data.payload.json), p(e.ports[0]);
      break;
    case "copilot/next-layout/upgrade-notice":
      oe(u, e.data.payload.reason, e.data.payload.title), p(e.ports[0]);
      break;
    case "copilot/turn-off-notice/show":
      vt(e.data.payload.reason), p(e.ports[0]);
      break;
    case "copilot/next-layout/status":
      if (!u.iframe) {
        p(e.ports[0]);
        return;
      }
      const l = e.data.payload.status === "idle";
      (o = u.iframe) == null || o.classList.toggle("elementor-copilot--idle", l), l ? Ht(u.iframe) : Ft(u.iframe), p(e.ports[0]);
      break;
  }
}, gt = async () => {
  var e;
  (e = u.previewAreaWrapper) == null || e.remove();
}, ht = async () => {
  if (u.iframe && u.iframe.isConnected)
    return u.iframe;
  const e = window.elementor.$previewContents[0], t = e.querySelector("#elementor-add-new-section"), n = "copilot/next-layout-button", { iframe: o, iframeUrlObject: r } = await _({
    path: n,
    parent: e,
    insertCallback: (i) => {
      var s;
      (s = t == null ? void 0 : t.parentElement) == null || s.insertBefore(i, t);
    },
    css: {
      height: "80px",
      "z-index": 999999999
    }
  });
  return o.classList.add("elementor-copilot--idle"), u.isOpen = !0, u.iframe = o, u.isHidden = !1, u.iframeUrlObject = r, window.elementorFrontend.elements.$window[0].addEventListener("beforeunload", () => {
    u.iframe && (u.iframe = null);
  }), window == null || window.addEventListener("message", async (i) => {
    if (i.origin === r.origin)
      try {
        await yn(i);
      } catch (s) {
        k(i.ports[0], s);
      }
  }), u.iframe;
};
var Ct = /* @__PURE__ */ ((e) => (e.ON = "on", e.OFF = "off", e.SNOOZED_24H = "snoozed_24h", e.SNOOZED_7D = "snoozed_7d", e))(Ct || {});
const g = "copilot", ie = "copilot_snooze_until", je = "elementor-copilot/maybe-off/last-notice";
function Ue(e, t, n, o) {
  let r = !1;
  const i = {};
  return Object.keys(e).forEach((s) => {
    i[s] = e[s], s === o && (r = !0, i[t] = n);
  }), r || (i[t] = n), i;
}
const yt = (e, t) => new Promise((n) => {
  var r;
  console.log("asking copilot for set user preferences");
  const o = new MessageChannel();
  o.port1.onmessage = (i) => {
    n(i.data);
  }, (r = e.contentWindow) == null || r.postMessage(
    {
      type: "copilot/user-preferences/set",
      payload: t
    },
    new URL(e.src).origin,
    [o.port2]
  );
}), bn = (e) => e.hasOwnProperty(g) ? e[g] === "on" || se(e) && !bt() : !0, se = (e) => e[g] === "snoozed_24h" || e[g] === "snoozed_7d", bt = () => {
  const e = window.localStorage.getItem(ie);
  return !!e && Date.now() < parseInt(e, 10);
}, St = (e) => {
  const t = e === "snoozed_7d" ? 7 : 1, n = Date.now() + t * 24 * 60 * 60 * 1e3;
  window.localStorage.setItem(ie, n.toString());
}, vt = async (e) => {
  const t = window.localStorage.getItem(je);
  if (t && Date.now() - parseInt(t, 10) < 3 * 24 * 60 * 60 * 1e3)
    return;
  window.localStorage.setItem(je, Date.now().toString());
  const { iframe: n, iframeUrlObject: o } = await _({
    path: "copilot/turn-off-notice?colorScheme=dark&reason=" + e,
    css: {
      position: "fixed",
      height: "200px",
      width: "300px",
      bottom: "20px",
      "border-radius": "5px",
      "z-index": 999999999
    }
  }), r = (i) => {
    i.origin === o.origin && (i.data.type === "copilot/turn-off-notice/take-me-there" && (window.$e.route("panel/editor-preferences"), n.remove(), window.removeEventListener("message", r)), i.data.type === "copilot/turn-off-notice/got-it" && (n.remove(), window.removeEventListener("message", r)));
  };
  window.addEventListener("message", r);
};
window.addEventListener("message", async (e) => {
  var t, n;
  switch (e.data.type) {
    case "copilot/user-preferences/snooze": {
      const o = e.data.payload.status;
      St(o), window.elementor.getPanelView().getPages("editorPreferences_settings").options.model.set(g, o);
      const r = await wt({
        status: o,
        prevStatus: e.data.payload.prevStatus,
        requestId: e.data.payload.requestId
      });
      r.status === "success" && ((t = r.result) != null && t.maybeTurnOff) ? await vt(o) : window.elementor.notifications.showToast({
        sticky: !0,
        message: o === "snoozed_7d" ? "Copilot will take the week off. You can change this setting in your User Preferences." : "Copilot will take the day off. You can change this setting in your User Preferences.",
        buttons: [
          {
            name: "take-me-there",
            text: "Take me there",
            callback: () => {
              window.$e.route("panel/editor-preferences");
            }
          }
        ]
      }), e.ports[0].postMessage({
        status: "success"
      });
      break;
    }
    case "copilot/user-preferences/enable": {
      window.elementor.getPanelView().getPages("editorPreferences_settings").options.model.set(
        g,
        "on"
        /* ON */
      ), await ft({
        prevStatus: (n = e.data.payload) == null ? void 0 : n.prevStatus
      }), e.ports[0].postMessage({
        status: "success"
      });
      break;
    }
  }
});
const Ve = async (e) => {
  e.changed[g] && (se(e.attributes) ? St(e.get(g)) : window.localStorage.removeItem(ie), e.get(g) === "on" ? ft({
    prevStatus: e._previousAttributes[g]
  }) : wt({
    status: e.get(g),
    prevStatus: e._previousAttributes[g]
  }));
}, W = [], Sn = (e, t) => {
  if (t === "panel/editor-preferences") {
    const n = window.elementor.getPanelView().getPages("editorPreferences_settings").options;
    n.controls[g] && delete n.controls[g], n.controls.edit_buttons.separator = "before", n.controls = Ue(
      n.controls,
      "ai",
      {
        label: "AI",
        separator: "before",
        type: "heading",
        tab: "settings",
        section: "preferences",
        name: g
      },
      "enable_styleguide_preview"
    ), n.controls = Ue(
      n.controls,
      g,
      {
        label: "Editor Copilot",
        show_label: !0,
        label_block: !1,
        description: "Get instant suggestions from AI during your workflow.",
        separator: "after",
        options: {
          on: "On",
          snoozed_24h: "Snooze for 1 day",
          snoozed_7d: "Snooze for 7 days",
          off: "Off"
        },
        type: "select",
        tab: "settings",
        section: "preferences",
        name: g,
        default: "off"
        /* OFF */
      },
      "ai"
    ), typeof n.model.get(g) > "u" ? n.model.set(
      g,
      "off"
      /* OFF */
    ) : se(n.model.attributes) && !bt() && n.model.set(
      g,
      "on"
      /* ON */
    ), n.model.on("change", Ve), W.push(() => {
      n.model.off("change", Ve);
    });
  } else
    W.length && (W.forEach((n) => n()), W.length = 0);
}, vn = () => {
  window.$e.routes.on("run:before", Sn);
}, xn = (e, t) => {
  let n = !1;
  return function(...o) {
    n || (e.apply(this, o), n = !0, setTimeout(() => {
      n = !1;
    }, t));
  };
}, En = /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i, Fe = (e) => {
  if (typeof e != "string")
    throw new TypeError("Invalid argument expected string");
  const t = e.match(En);
  if (!t)
    throw new Error(`Invalid argument not valid semver ('${e}' received)`);
  return t.shift(), t;
}, He = (e) => e === "*" || e === "x" || e === "X", Be = (e) => {
  const t = parseInt(e, 10);
  return isNaN(t) ? e : t;
}, In = (e, t) => typeof e != typeof t ? [String(e), String(t)] : [e, t], An = (e, t) => {
  if (He(e) || He(t))
    return 0;
  const [n, o] = In(Be(e), Be(t));
  return n > o ? 1 : n < o ? -1 : 0;
}, We = (e, t) => {
  for (let n = 0; n < Math.max(e.length, t.length); n++) {
    const o = An(e[n] || "0", t[n] || "0");
    if (o !== 0)
      return o;
  }
  return 0;
}, Ln = (e, t) => {
  const n = Fe(e), o = Fe(t), r = n.pop(), i = o.pop(), s = We(n, o);
  return s !== 0 ? s : r && i ? We(r.split("."), i.split(".")) : r || i ? r ? -1 : 1 : 0;
}, _n = (e, t, n) => {
  Tn(n);
  const o = Ln(e, t);
  return xt[n].includes(o);
}, xt = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
}, Ne = Object.keys(xt), Tn = (e) => {
  if (typeof e != "string")
    throw new TypeError(`Invalid operator type, expected string but got ${typeof e}`);
  if (Ne.indexOf(e) === -1)
    throw new Error(`Invalid operator, expected one of ${Ne.join("|")}`);
}, Et = (e) => {
  var t;
  return _n((t = window.elementor.config) == null ? void 0 : t.version, e, ">=");
}, qe = "3.20.0", $n = () => typeof window.elementor.widgetsCache.container < "u", ze = async () => {
  vn();
  const e = window.elementor.config.settings.editorPreferences.settings;
  if (!bn(e))
    return;
  const t = window.elementorFrontend.elements.$body[0].querySelector(".elementor-edit-area-active");
  if (!t)
    return;
  const o = xn((i) => {
    const a = i.clientY - t.getBoundingClientRect().top > t.firstChild.clientHeight;
    u.iframe && u.iframe.classList.contains("elementor-copilot--idle") && (u.iframe.style.opacity = a ? "1" : "0", u.iframe.style.visibility = a ? "visible" : "hidden");
  }, 100), r = () => {
    var i;
    u.iframe && u.iframe.classList.contains("elementor-copilot--idle") && !((i = u.noticeIframe) != null && i.isConnected) && (u.iframe.style.transition = "opacity 0.3s", u.iframe.style.opacity = "0", u.iframe.style.visibility = "hidden");
  };
  t.addEventListener("mouseover", o), j.listeners.push(() => t.removeEventListener("mouseover", o)), t.addEventListener("mousemove", o), j.listeners.push(() => t.removeEventListener("mousemove", o)), t.addEventListener("mouseleave", r), j.listeners.push(() => t.removeEventListener("mouseleave", r)), hn(), Cn(() => {
    u.iframe && Bt(u.iframe);
  });
}, kn = () => {
  window.elementor.on("document:loaded", async () => {
    if (u.started) {
      await ze();
      return;
    }
    window.elementorFrontend.on("components:init", async () => {
      var e;
      if (!Et(qe)) {
        console.log("Copilot is not supported in this editor version", {
          currentVersion: (e = window.elementor.config) == null ? void 0 : e.version,
          minVersion: qe
        });
        return;
      }
      $n() && (u.started = !0, await ze());
    });
  });
}, Pn = async () => {
  var t;
  return !!((t = (await it()).features) != null && t.includes("inactive-users-promotion"));
}, It = "inactive-users-promotion", Mn = () => {
  var e, t, n;
  return !!((n = (t = (e = window.elementor.config) == null ? void 0 : e.user) == null ? void 0 : t.introduction) != null && n[It]);
}, On = async () => (await window.elementorCommon.ajax.addRequest("introduction_viewed", {
  data: { introductionKey: It }
}), !0), Rn = async () => {
  await Pn() && (Mn() || (window == null || window.addEventListener("message", async (t) => {
    switch (t.data.type) {
      case "ai/text-based-containers/open": {
        window.elementorFrontend.elements.$body[0].querySelector(".e-ai-layout-button").click(), p(t.ports[0]);
        break;
      }
      case "ai/inactive-users-promotion/mark-as-viewed": {
        await On(), p(t.ports[0]);
        break;
      }
    }
  }), await _({
    path: "inactive-users-promotion",
    css: {
      width: "100%",
      height: "100%",
      position: "fixed",
      bottom: 0,
      right: 0,
      "z-index": 999999
    }
  })));
}, Dn = () => {
  window.$e.run("panel/close"), window.$e.components.get("panel").blockUserInteractions();
}, jn = () => {
  window.$e.run("panel/open"), window.$e.components.get("panel").unblockUserInteractions();
}, Un = () => {
  const e = new MutationObserver((t) => {
    for (const n of t)
      if (n.type === "childList" && n.addedNodes.length && "classList" in n.addedNodes[0] && n.addedNodes[0].classList.contains("MuiDialog-root")) {
        n.addedNodes[0].remove();
        return;
      }
  });
  return e.observe(document.body, {
    childList: !0,
    subtree: !0
  }), e;
}, Vn = (e) => {
  const t = new MutationObserver((n) => {
    for (const o of n)
      if (o.type === "childList" && o.addedNodes.length && "querySelector" in o.addedNodes[0]) {
        const r = o.addedNodes[0].querySelector(".e-ai-layout-button");
        if (r) {
          e(r);
          return;
        }
      }
  });
  return t.observe(window.elementorFrontend.elements.$body[0], {
    childList: !0,
    subtree: !0
  }), t;
};
function Fn(e, t) {
  if (e.match(/^[a-z]+:\/\//i))
    return e;
  if (e.match(/^\/\//))
    return window.location.protocol + e;
  if (e.match(/^[a-z]+:/i))
    return e;
  const n = document.implementation.createHTMLDocument(), o = n.createElement("base"), r = n.createElement("a");
  return n.head.appendChild(o), n.body.appendChild(r), t && (o.href = t), r.href = e, r.href;
}
const Hn = /* @__PURE__ */ (() => {
  let e = 0;
  const t = () => (
    // eslint-disable-next-line no-bitwise
    `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
  );
  return () => (e += 1, `u${t()}${e}`);
})();
function A(e) {
  const t = [];
  for (let n = 0, o = e.length; n < o; n++)
    t.push(e[n]);
  return t;
}
function q(e, t) {
  const o = (e.ownerDocument.defaultView || window).getComputedStyle(e).getPropertyValue(t);
  return o ? parseFloat(o.replace("px", "")) : 0;
}
function Bn(e) {
  const t = q(e, "border-left-width"), n = q(e, "border-right-width");
  return e.clientWidth + t + n;
}
function Wn(e) {
  const t = q(e, "border-top-width"), n = q(e, "border-bottom-width");
  return e.clientHeight + t + n;
}
function At(e, t = {}) {
  const n = t.width || Bn(e), o = t.height || Wn(e);
  return { width: n, height: o };
}
function Nn() {
  let e, t;
  try {
    t = process;
  } catch {
  }
  const n = t && t.env ? t.env.devicePixelRatio : null;
  return n && (e = parseInt(n, 10), Number.isNaN(e) && (e = 1)), e || window.devicePixelRatio || 1;
}
const S = 16384;
function qn(e) {
  (e.width > S || e.height > S) && (e.width > S && e.height > S ? e.width > e.height ? (e.height *= S / e.width, e.width = S) : (e.width *= S / e.height, e.height = S) : e.width > S ? (e.height *= S / e.width, e.width = S) : (e.width *= S / e.height, e.height = S));
}
function z(e) {
  return new Promise((t, n) => {
    const o = new Image();
    o.decode = () => t(o), o.onload = () => t(o), o.onerror = n, o.crossOrigin = "anonymous", o.decoding = "async", o.src = e;
  });
}
async function zn(e) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(e)).then(encodeURIComponent).then((t) => `data:image/svg+xml;charset=utf-8,${t}`);
}
async function Gn(e, t, n) {
  const o = "http://www.w3.org/2000/svg", r = document.createElementNS(o, "svg"), i = document.createElementNS(o, "foreignObject");
  return r.setAttribute("width", `${t}`), r.setAttribute("height", `${n}`), r.setAttribute("viewBox", `0 0 ${t} ${n}`), i.setAttribute("width", "100%"), i.setAttribute("height", "100%"), i.setAttribute("x", "0"), i.setAttribute("y", "0"), i.setAttribute("externalResourcesRequired", "true"), r.appendChild(i), i.appendChild(e), zn(r);
}
const y = (e, t) => {
  if (e instanceof t)
    return !0;
  const n = Object.getPrototypeOf(e);
  return n === null ? !1 : n.constructor.name === t.name || y(n, t);
};
function Kn(e) {
  const t = e.getPropertyValue("content");
  return `${e.cssText} content: '${t.replace(/'|"/g, "")}';`;
}
function Yn(e) {
  return A(e).map((t) => {
    const n = e.getPropertyValue(t), o = e.getPropertyPriority(t);
    return `${t}: ${n}${o ? " !important" : ""};`;
  }).join(" ");
}
function Zn(e, t, n) {
  const o = `.${e}:${t}`, r = n.cssText ? Kn(n) : Yn(n);
  return document.createTextNode(`${o}{${r}}`);
}
function Ge(e, t, n) {
  const o = window.getComputedStyle(e, n), r = o.getPropertyValue("content");
  if (r === "" || r === "none")
    return;
  const i = Hn();
  try {
    t.className = `${t.className} ${i}`;
  } catch {
    return;
  }
  const s = document.createElement("style");
  s.appendChild(Zn(i, n, o)), t.appendChild(s);
}
function Xn(e, t) {
  Ge(e, t, ":before"), Ge(e, t, ":after");
}
const Ke = "application/font-woff", Ye = "image/jpeg", Qn = {
  woff: Ke,
  woff2: Ke,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: Ye,
  jpeg: Ye,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function Jn(e) {
  const t = /\.([^./]*?)$/g.exec(e);
  return t ? t[1] : "";
}
function ae(e) {
  const t = Jn(e).toLowerCase();
  return Qn[t] || "";
}
function eo(e) {
  return e.split(/,/)[1];
}
function re(e) {
  return e.search(/^(data:)/) !== -1;
}
function Lt(e, t) {
  return `data:${t};base64,${e}`;
}
async function _t(e, t, n) {
  const o = await fetch(e, t);
  if (o.status === 404)
    throw new Error(`Resource "${o.url}" not found`);
  const r = await o.blob();
  return new Promise((i, s) => {
    const a = new FileReader();
    a.onerror = s, a.onloadend = () => {
      try {
        i(n({ res: o, result: a.result }));
      } catch (c) {
        s(c);
      }
    }, a.readAsDataURL(r);
  });
}
const Y = {};
function to(e, t, n) {
  let o = e.replace(/\?.*/, "");
  return n && (o = e), /ttf|otf|eot|woff2?/i.test(o) && (o = o.replace(/.*\//, "")), t ? `[${t}]${o}` : o;
}
async function ce(e, t, n) {
  const o = to(e, t, n.includeQueryParams);
  if (Y[o] != null)
    return Y[o];
  n.cacheBust && (e += (/\?/.test(e) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime());
  let r;
  try {
    const i = await _t(e, n.fetchRequestInit, ({ res: s, result: a }) => (t || (t = s.headers.get("Content-Type") || ""), eo(a)));
    r = Lt(i, t);
  } catch (i) {
    r = n.imagePlaceholder || "";
    let s = `Failed to fetch resource: ${e}`;
    i && (s = typeof i == "string" ? i : i.message), s && console.warn(s);
  }
  return Y[o] = r, r;
}
async function no(e) {
  const t = e.toDataURL();
  return t === "data:," ? e.cloneNode(!1) : z(t);
}
async function oo(e, t) {
  if (e.currentSrc) {
    const i = document.createElement("canvas"), s = i.getContext("2d");
    i.width = e.clientWidth, i.height = e.clientHeight, s == null || s.drawImage(e, 0, 0, i.width, i.height);
    const a = i.toDataURL();
    return z(a);
  }
  const n = e.poster, o = ae(n), r = await ce(n, o, t);
  return z(r);
}
async function ro(e) {
  var t;
  try {
    if (!((t = e == null ? void 0 : e.contentDocument) === null || t === void 0) && t.body)
      return await G(e.contentDocument.body, {}, !0);
  } catch {
  }
  return e.cloneNode(!1);
}
async function io(e, t) {
  return y(e, HTMLCanvasElement) ? no(e) : y(e, HTMLVideoElement) ? oo(e, t) : y(e, HTMLIFrameElement) ? ro(e) : e.cloneNode(!1);
}
const so = (e) => e.tagName != null && e.tagName.toUpperCase() === "SLOT";
async function ao(e, t, n) {
  var o, r;
  let i = [];
  return so(e) && e.assignedNodes ? i = A(e.assignedNodes()) : y(e, HTMLIFrameElement) && (!((o = e.contentDocument) === null || o === void 0) && o.body) ? i = A(e.contentDocument.body.childNodes) : i = A(((r = e.shadowRoot) !== null && r !== void 0 ? r : e).childNodes), i.length === 0 || y(e, HTMLVideoElement) || await i.reduce((s, a) => s.then(() => G(a, n)).then((c) => {
    c && t.appendChild(c);
  }), Promise.resolve()), t;
}
function co(e, t) {
  const n = t.style;
  if (!n)
    return;
  const o = window.getComputedStyle(e);
  o.cssText ? (n.cssText = o.cssText, n.transformOrigin = o.transformOrigin) : A(o).forEach((r) => {
    let i = o.getPropertyValue(r);
    r === "font-size" && i.endsWith("px") && (i = `${Math.floor(parseFloat(i.substring(0, i.length - 2))) - 0.1}px`), y(e, HTMLIFrameElement) && r === "display" && i === "inline" && (i = "block"), r === "d" && t.getAttribute("d") && (i = `path(${t.getAttribute("d")})`), n.setProperty(r, i, o.getPropertyPriority(r));
  });
}
function lo(e, t) {
  y(e, HTMLTextAreaElement) && (t.innerHTML = e.value), y(e, HTMLInputElement) && t.setAttribute("value", e.value);
}
function uo(e, t) {
  if (y(e, HTMLSelectElement)) {
    const n = t, o = Array.from(n.children).find((r) => e.value === r.getAttribute("value"));
    o && o.setAttribute("selected", "");
  }
}
function mo(e, t) {
  return y(t, Element) && (co(e, t), Xn(e, t), lo(e, t), uo(e, t)), t;
}
async function po(e, t) {
  const n = e.querySelectorAll ? e.querySelectorAll("use") : [];
  if (n.length === 0)
    return e;
  const o = {};
  for (let i = 0; i < n.length; i++) {
    const a = n[i].getAttribute("xlink:href");
    if (a) {
      const c = e.querySelector(a), l = document.querySelector(a);
      !c && l && !o[a] && (o[a] = await G(l, t, !0));
    }
  }
  const r = Object.values(o);
  if (r.length) {
    const i = "http://www.w3.org/1999/xhtml", s = document.createElementNS(i, "svg");
    s.setAttribute("xmlns", i), s.style.position = "absolute", s.style.width = "0", s.style.height = "0", s.style.overflow = "hidden", s.style.display = "none";
    const a = document.createElementNS(i, "defs");
    s.appendChild(a);
    for (let c = 0; c < r.length; c++)
      a.appendChild(r[c]);
    e.appendChild(s);
  }
  return e;
}
async function G(e, t, n) {
  return !n && t.filter && !t.filter(e) ? null : Promise.resolve(e).then((o) => io(o, t)).then((o) => ao(e, o, t)).then((o) => mo(e, o)).then((o) => po(o, t));
}
const Tt = /url\((['"]?)([^'"]+?)\1\)/g, fo = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g, wo = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function go(e) {
  const t = e.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${t})(['"]?\\))`, "g");
}
function ho(e) {
  const t = [];
  return e.replace(Tt, (n, o, r) => (t.push(r), n)), t.filter((n) => !re(n));
}
async function Co(e, t, n, o, r) {
  try {
    const i = n ? Fn(t, n) : t, s = ae(t);
    let a;
    if (r) {
      const c = await r(i);
      a = Lt(c, s);
    } else
      a = await ce(i, s, o);
    return e.replace(go(t), `$1${a}$3`);
  } catch {
  }
  return e;
}
function yo(e, { preferredFontFormat: t }) {
  return t ? e.replace(wo, (n) => {
    for (; ; ) {
      const [o, , r] = fo.exec(n) || [];
      if (!r)
        return "";
      if (r === t)
        return `src: ${o};`;
    }
  }) : e;
}
function $t(e) {
  return e.search(Tt) !== -1;
}
async function kt(e, t, n) {
  if (!$t(e))
    return e;
  const o = yo(e, n);
  return ho(o).reduce((i, s) => i.then((a) => Co(a, s, t, n)), Promise.resolve(o));
}
async function N(e, t, n) {
  var o;
  const r = (o = t.style) === null || o === void 0 ? void 0 : o.getPropertyValue(e);
  if (r) {
    const i = await kt(r, null, n);
    return t.style.setProperty(e, i, t.style.getPropertyPriority(e)), !0;
  }
  return !1;
}
async function bo(e, t) {
  await N("background", e, t) || await N("background-image", e, t), await N("mask", e, t) || await N("mask-image", e, t);
}
async function So(e, t) {
  const n = y(e, HTMLImageElement);
  if (!(n && !re(e.src)) && !(y(e, SVGImageElement) && !re(e.href.baseVal)))
    return;
  const o = n ? e.src : e.href.baseVal, r = await ce(o, ae(o), t);
  await new Promise((i, s) => {
    e.onload = i, e.onerror = s;
    const a = e;
    a.decode && (a.decode = i), a.loading === "lazy" && (a.loading = "eager"), n ? (e.srcset = "", e.src = r) : e.href.baseVal = r;
  });
}
async function vo(e, t) {
  const o = A(e.childNodes).map((r) => Pt(r, t));
  await Promise.all(o).then(() => e);
}
async function Pt(e, t) {
  y(e, Element) && (await bo(e, t), await So(e, t), await vo(e, t));
}
function xo(e, t) {
  const { style: n } = e;
  t.backgroundColor && (n.backgroundColor = t.backgroundColor), t.width && (n.width = `${t.width}px`), t.height && (n.height = `${t.height}px`);
  const o = t.style;
  return o != null && Object.keys(o).forEach((r) => {
    n[r] = o[r];
  }), e;
}
const Ze = {};
async function Xe(e) {
  let t = Ze[e];
  if (t != null)
    return t;
  const o = await (await fetch(e)).text();
  return t = { url: e, cssText: o }, Ze[e] = t, t;
}
async function Qe(e, t) {
  let n = e.cssText;
  const o = /url\(["']?([^"')]+)["']?\)/g, i = (n.match(/url\([^)]+\)/g) || []).map(async (s) => {
    let a = s.replace(o, "$1");
    return a.startsWith("https://") || (a = new URL(a, e.url).href), _t(a, t.fetchRequestInit, ({ result: c }) => (n = n.replace(s, `url(${c})`), [s, c]));
  });
  return Promise.all(i).then(() => n);
}
function Je(e) {
  if (e == null)
    return [];
  const t = [], n = /(\/\*[\s\S]*?\*\/)/gi;
  let o = e.replace(n, "");
  const r = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  for (; ; ) {
    const c = r.exec(o);
    if (c === null)
      break;
    t.push(c[0]);
  }
  o = o.replace(r, "");
  const i = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi, s = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})", a = new RegExp(s, "gi");
  for (; ; ) {
    let c = i.exec(o);
    if (c === null) {
      if (c = a.exec(o), c === null)
        break;
      i.lastIndex = a.lastIndex;
    } else
      a.lastIndex = i.lastIndex;
    t.push(c[0]);
  }
  return t;
}
async function Eo(e, t) {
  const n = [], o = [];
  return e.forEach((r) => {
    if ("cssRules" in r)
      try {
        A(r.cssRules || []).forEach((i, s) => {
          if (i.type === CSSRule.IMPORT_RULE) {
            let a = s + 1;
            const c = i.href, l = Xe(c).then((d) => Qe(d, t)).then((d) => Je(d).forEach((w) => {
              try {
                r.insertRule(w, w.startsWith("@import") ? a += 1 : r.cssRules.length);
              } catch (m) {
                console.error("Error inserting rule from remote css", {
                  rule: w,
                  error: m
                });
              }
            })).catch((d) => {
              console.error("Error loading remote css", d.toString());
            });
            o.push(l);
          }
        });
      } catch (i) {
        const s = e.find((a) => a.href == null) || document.styleSheets[0];
        r.href != null && o.push(Xe(r.href).then((a) => Qe(a, t)).then((a) => Je(a).forEach((c) => {
          s.insertRule(c, r.cssRules.length);
        })).catch((a) => {
          console.error("Error loading remote stylesheet", a);
        })), console.error("Error inlining remote css file", i);
      }
  }), Promise.all(o).then(() => (e.forEach((r) => {
    if ("cssRules" in r)
      try {
        A(r.cssRules || []).forEach((i) => {
          n.push(i);
        });
      } catch (i) {
        console.error(`Error while reading CSS rules from ${r.href}`, i);
      }
  }), n));
}
function Io(e) {
  return e.filter((t) => t.type === CSSRule.FONT_FACE_RULE).filter((t) => $t(t.style.getPropertyValue("src")));
}
async function Ao(e, t) {
  if (e.ownerDocument == null)
    throw new Error("Provided element is not within a Document");
  const n = A(e.ownerDocument.styleSheets), o = await Eo(n, t);
  return Io(o);
}
async function Lo(e, t) {
  const n = await Ao(e, t);
  return (await Promise.all(n.map((r) => {
    const i = r.parentStyleSheet ? r.parentStyleSheet.href : null;
    return kt(r.cssText, i, t);
  }))).join(`
`);
}
async function _o(e, t) {
  const n = t.fontEmbedCSS != null ? t.fontEmbedCSS : t.skipFonts ? null : await Lo(e, t);
  if (n) {
    const o = document.createElement("style"), r = document.createTextNode(n);
    o.appendChild(r), e.firstChild ? e.insertBefore(o, e.firstChild) : e.appendChild(o);
  }
}
async function To(e, t = {}) {
  const { width: n, height: o } = At(e, t), r = await G(e, t, !0);
  return await _o(r, t), await Pt(r, t), xo(r, t), await Gn(r, n, o);
}
async function $o(e, t = {}) {
  const { width: n, height: o } = At(e, t), r = await To(e, t), i = await z(r), s = document.createElement("canvas"), a = s.getContext("2d"), c = t.pixelRatio || Nn(), l = t.canvasWidth || n, d = t.canvasHeight || o;
  return s.width = l * c, s.height = d * c, t.skipAutoScale || qn(s), s.style.width = `${l}`, s.style.height = `${d}`, t.backgroundColor && (a.fillStyle = t.backgroundColor, a.fillRect(0, 0, s.width, s.height)), a.drawImage(i, 0, 0, s.width, s.height), s;
}
function O(e) {
  window.elementor.documents.getCurrent().history.setActive(e);
}
function ko(e) {
  const t = window.$e.internal("document/history/start-log", e);
  return () => window.$e.internal("document/history/end-log", { id: t });
}
const Po = async (e) => {
  if (!e)
    return "";
  O(!1);
  const t = Ro(), n = jo(e);
  Ho(n, t), window.elementor.getPreviewView().$childViewContainer[0].appendChild(t), await et(n.id), e.elements.length && await Promise.all(e.elements.map((r) => et(r.id)));
  let o;
  try {
    o = await Mo(n.view.$el[0]);
  } catch {
    o = "";
  }
  return Uo(n), t.remove(), O(!0), o;
};
function Mo(e) {
  return Oo(e, {
    quality: 0.01,
    // Transparent 1x1 pixel.
    imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  });
}
async function Oo(e, t = {}) {
  return (await $o(e, t)).toDataURL("image/webp", t.quality ?? 1);
}
function Ro() {
  const e = document.createElement("div");
  return e.style.position = "fixed", e.style.opacity = "0", e.style.inset = "0", e;
}
const Do = (e) => (e ? e + "-" : "") + Math.random().toString(16).substr(2, 7);
function le(e) {
  var t;
  return e.id = Do().toString(), (t = e.elements) != null && t.length && e.elements.map((n) => le(n)), e;
}
function jo(e) {
  const t = le(e);
  return t.id = `e-ai-screenshot-container-${t.id}`, window.$e.run("document/elements/create", {
    container: window.elementor.getPreviewContainer(),
    model: t,
    options: {
      edit: !1
    }
  });
}
function Uo(e) {
  return window.$e.run("document/elements/delete", {
    container: e
  });
}
function et(e, t = 5e3) {
  const n = Fo(t), o = new Promise((r) => {
    window.elementorFrontend.hooks.addAction("frontend/element_ready/global", async (i) => {
      if (i.data("id") === e) {
        const s = [...i[0].querySelectorAll("img")];
        await Promise.all(s.map(Vo)), r();
      }
    });
  });
  return Promise.any([
    n,
    o
  ]);
}
function Vo(e) {
  return e.complete ? Promise.resolve() : new Promise((t) => {
    e.addEventListener("load", t), e.addEventListener("error", () => {
      e.remove(), t();
    });
  });
}
function Fo(e) {
  return new Promise((t) => setTimeout(t, e));
}
function Ho(e, t) {
  const n = e.view.$el[0];
  n.parentNode.insertBefore(t, n), t.appendChild(n);
}
const Bo = ({ parentContainer: e, at: t, template: n, historyTitle: o, replace: r = !1 }) => {
  const i = ko({
    type: "import",
    title: o
  });
  r && window.$e.run("document/elements/delete", {
    container: e.children.at(t)
  }), window.$e.run("document/elements/create", {
    container: e,
    model: le(n),
    options: {
      at: t,
      edit: !0
    }
  }), i();
}, de = "e-ai-preview-container", ue = de + "--hidden", Wo = de + "--idle";
function No(e, t = {}) {
  const n = /* @__PURE__ */ new Map(), o = qo(e, t);
  function r() {
    Z(o);
  }
  function i() {
    return [...n.values(), o];
  }
  function s() {
    tt([...n.values()]), n.clear(), Z(o);
  }
  function a(l) {
    if (l) {
      if (zo(i()), !n.has(l)) {
        const d = Mt(e, l, t);
        n.set(l, d);
      }
      Z(n.get(l));
    }
  }
  function c() {
    tt(i()), n.clear();
  }
  return {
    init: r,
    reset: s,
    setContent: a,
    destroy: c
  };
}
function Mt(e, t, n = {}) {
  O(!1);
  const o = window.$e.run("document/elements/create", {
    container: e,
    model: {
      ...t,
      id: `${de}-${window.elementorCommon.helpers.getUniqueId().toString()}`
    },
    options: {
      ...n,
      edit: !1
    }
  });
  return O(!0), o.view.$el.addClass(ue), o;
}
function qo(e, t = {}) {
  const n = Mt(e, { elType: "container" }, t);
  return n.view.$el.addClass(Wo), n;
}
function zo(e) {
  e.forEach((t) => {
    t.view.$el.addClass(ue);
  });
}
function Z(e) {
  e.view.$el.removeClass(ue), setTimeout(() => {
    e.view.$el[0].scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}
function tt(e) {
  O(!1), window.$e.run("document/elements/delete", { containers: e }), O(!0);
}
const Ot = (e) => {
  var n;
  const t = (o) => {
    o.htmlCache && (o.htmlCache = ""), o.elements && o.elements.forEach(t);
  };
  return (n = e.elements) == null || n.forEach(t), e;
};
class Go extends Marionette.Behavior {
  ui() {
    return {
      applyButton: ".elementor-template-library-template-apply-ai"
    };
  }
  events() {
    return {
      "click @ui.applyButton": "onApplyButtonClick"
    };
  }
  onApplyButtonClick() {
    const t = {
      model: this.view.model
    };
    if (this.ui.applyButton.addClass("elementor-disabled"), t.model.get("source") === "remote" && !elementor.config.library_connect.is_connected) {
      window.$e.route("library/connect", t);
      return;
    }
    f.isApplyingTemplate = !0, window.$e.components.get("library").downloadTemplate(t, (n) => {
      const o = t.model, r = Ot(n.content[0]);
      f.iframe.contentWindow.postMessage({
        type: "library/attach",
        json: r,
        html: `<img src="${o.get("thumbnail")}" />`,
        label: `${o.get("template_id")} - ${o.get("title")}`,
        source: Rt
      }, f.iframeUrlObject.origin);
    });
  }
}
class Ko extends Marionette.Behavior {
  ui() {
    return {
      generateVariation: ".elementor-template-library-template-generate-variation"
    };
  }
  events() {
    return {
      "click @ui.generateVariation": "onGenerateVariationClick"
    };
  }
  onGenerateVariationClick() {
    var r, i;
    const t = {
      model: this.view.model
    }, n = $e.components.get("library"), o = (i = (r = n.manager.modalConfig) == null ? void 0 : r.importOptions) == null ? void 0 : i.at;
    n.downloadTemplate(t, async (s) => {
      const a = t.model, c = (l) => {
        var w;
        if (l.origin !== ((w = f.iframeUrlObject) == null ? void 0 : w.origin) || l.data.type !== "text-to-elementor/loaded")
          return;
        const d = Ot(s.content[0]);
        f.iframe.contentWindow.postMessage({
          type: "library/attach",
          json: d,
          html: `<img src="${a.get("thumbnail")}" />`,
          label: `${a.get("template_id")} - ${a.get("title")}`,
          source: Rt
        }, f.iframeUrlObject.origin), window.$e.run("library/close"), window.removeEventListener("message", c);
      };
      window.addEventListener("message", c), window.$e.run("ai-integration/open-text-to-elementor", {
        at: o
      });
    });
  }
}
const nt = "ai-attachment", Rt = "elementor-library";
class Yo extends elementorModules.editor.utils.Module {
  constructor() {
    super(), elementor.hooks.addFilter("elementor/editor/template-library/template/behaviors", this.registerLibraryActionButtonBehavior), elementor.hooks.addFilter("elementor/editor/template-library/template/action-button", this.filterLibraryActionButtonTemplate, 11);
  }
  registerLibraryActionButtonBehavior(t) {
    const n = $e.components.get("library").manager.modalConfig;
    return nt === n.mode ? t.applyAiIntegrationTemplate = {
      behaviorClass: Go
    } : t.createAiIntegrationTemplateVariation = {
      behaviorClass: Ko
    }, t;
  }
  filterLibraryActionButtonTemplate(t) {
    const n = $e.components.get("library").manager.modalConfig;
    return "#tmpl-elementor-template-library-insert-button" !== t || $e.routes.current.library !== "library/templates/blocks" || (nt === n.mode ? t = "#tmpl-elementor-template-library-apply-ai-button" : t = "#tmpl-elementor-template-library-insert-and-ai-variations-buttons"), t;
  }
}
const f = {
  iframe: null,
  isOpen: !1,
  isHidden: !1,
  channel: null,
  iframeUrlObject: null,
  elementsModel: null,
  previewView: null,
  previewAreaWrapper: null,
  container: null,
  onMessage: null,
  isApplyingTemplate: !1
}, X = [];
let I;
const Zo = async (e, t) => {
  var r, i, s, a;
  const { type: n, payload: o } = e.data;
  switch (n) {
    case "text-to-elementor/unloaded":
      I && I.destroy(), p(e.ports[0]);
      break;
    case "text-to-elementor/loaded":
      Dn(), I = No(t.parentContainer, {
        // Create the container at the "drag widget here" area position.
        at: t.at
      }), I.init(), p(e.ports[0]);
      break;
    case "text-to-elementor/close":
      console.log("text-to-elementor/close", o), I == null || I.destroy(), window == null || window.removeEventListener("message", f.onMessage), (r = window.elementorFrontend.elements.$body[0].querySelector(".e-ai-preview-container--idle")) == null || r.remove(), f.isOpen = !1, jn(), p(e.ports[0]);
      break;
    case "text-to-elementor/take-screenshot":
      console.log("text-to-elementor/take-screenshot", o);
      const c = await Po(o.jsonTemplate);
      p(e.ports[0], c);
      break;
    case "text-to-elementor/create-from-library":
      f.isApplyingTemplate = !1, await window.$e.run("library/open", {
        toDefault: !0,
        mode: "ai-attachment"
      });
      const l = () => {
        f.isApplyingTemplate || (f.iframe.contentWindow.postMessage({
          type: "text-to-elementor/on-hide-library"
        }, f.iframeUrlObject.origin), window.$e.components.get("library").layout.getModal().off("hide", l));
      };
      window.$e.components.get("library").layout.getModal().on("hide", l), p(e.ports[0]);
      break;
    case "text-to-elementor/insert":
      console.log("text-to-elementor/insert", o), t.at && t.addSectionArea && t.addSectionArea.remove(), Bo({
        parentContainer: window.elementor.getPreviewContainer(),
        at: t.at,
        template: o.template,
        historyTitle: "AI Layout"
      }), p(e.ports[0]);
      break;
    case "text-to-elementor/onGenerate":
      console.log("text-to-elementor/onGenerate", o), I.reset(), p(e.ports[0]);
      break;
    case "text-to-elementor/select":
      console.log("text-to-elementor/onSelect", o), I.setContent(o.template), p(e.ports[0]);
      break;
    case "editor/route":
      await window.$e.route(o.route), p(e.ports[0]);
      break;
    case "editor/run":
      await window.$e.run(o.command, o.args), p(e.ports[0]);
      break;
    case "element-selector/attach":
      f.iframe.contentWindow.postMessage({
        type: "element-selector/attach",
        html: e.data.html,
        url: e.data.url
      }, f.iframeUrlObject.origin);
      break;
    case "element-selector/close":
      f.iframe.contentWindow.postMessage({
        type: "element-selector/close"
      }, f.iframeUrlObject.origin);
      break;
    case "iframe/scroll":
      window.elementorFrontend.elements.$body.parent()[0].scrollTop += o.deltaY;
      break;
    case "introduction_viewed":
      const d = window.elementor ? (i = window.elementor.config) == null ? void 0 : i.user : (a = (s = window.elementorAdmin) == null ? void 0 : s.config) == null ? void 0 : a.user;
      await window.elementorCommon.ajax.addRequest("introduction_viewed", {
        data: { introductionKey: o.introductionKey },
        error: () => {
          k(e.ports[0]);
        },
        success: () => {
          d != null && d.introduction && (d.introduction[o.introductionKey] = !0), p(e.ports[0], { success: !0 });
        }
      });
      break;
  }
}, Xo = async (e) => {
  if (f.iframe && f.iframe.isConnected)
    return f.iframe;
  const t = "text-to-elementor?at=" + (typeof e.at == "number" ? e.at : "unknown"), { iframe: n, iframeUrlObject: o } = await _({
    path: t,
    css: {
      height: "100%",
      width: "100vw",
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      "z-index": "9999",
      "background-color": "transparent",
      "color-scheme": "normal"
    }
  });
  return f.isOpen = !0, f.iframe = n, f.isHidden = !1, f.iframeUrlObject = o, f.onMessage = async (r) => {
    if (r.origin === o.origin)
      try {
        await Zo(r, e);
      } catch (i) {
        k(r.ports[0], i);
      }
  }, window == null || window.addEventListener("message", f.onMessage), f.iframe;
}, Qo = async () => {
  var o, r, i;
  window.$e.components.get("ai-integration").registerCommand("open-choose-element", (s) => {
    _({
      path: "/choose-element?url=" + encodeURIComponent(s.url || ""),
      css: {
        width: "100%",
        height: "100%",
        position: "fixed",
        bottom: 0,
        right: 0,
        "z-index": 999999
      }
    });
  });
  const e = await L;
  if (window.$e.components.get("ai-integration").registerCommand("open-text-to-elementor", async (s) => {
    Xo({
      ...s,
      parentContainer: window.elementor.getPreviewContainer(),
      remoteConfig: e
    });
  }), !(e != null && e.features.includes("text-to-elementor--saas")))
    return;
  new Yo();
  const t = (s) => {
    s.getAttribute("data-saas") || (s.setAttribute("data-saas", "true"), s.addEventListener("click", async (a) => {
      a.preventDefault(), a.stopPropagation();
      const c = Un(), l = window.elementor.elements.models.map((h) => h.get("id"));
      let d = null;
      const w = a.currentTarget.closest(".elementor-add-section"), m = w == null ? void 0 : w.previousSibling;
      if (!m)
        d = 0;
      else if (m.getAttribute("data-element_type") === "container") {
        const h = m.getAttribute("data-id");
        d = l.indexOf(h) + 1;
      } else
        d = l.length;
      window.$e.run("ai-integration/open-text-to-elementor", {
        at: d,
        addSectionArea: w
      }), c.disconnect();
    }));
  }, n = () => {
    const s = window.elementorFrontend.elements.$body[0].querySelectorAll(".e-ai-layout-button");
    s.length && s.forEach((a) => {
      t(a);
    }), X.push(Vn(t));
  };
  (i = (r = (o = window.elementorFrontend) == null ? void 0 : o.elements) == null ? void 0 : r.$body) != null && i[0] && n(), window.elementor.on("document:loaded", () => {
    var s, a, c;
    (c = (a = (s = window.elementorFrontend) == null ? void 0 : s.elements) == null ? void 0 : a.$body) != null && c[0] ? n() : window.elementorFrontend.on("components:init", n);
  }), window.elementor.on("document:unloaded", () => {
    X.forEach((s) => s.disconnect()), X.length = 0;
  });
};
class Jo extends window.$e.modules.ComponentBase {
  getNamespace() {
    return "ai-integration";
  }
}
const $ = "elementor--ai-structure-titles-animate", er = () => {
  const e = window.elementor.getPreviewContainer().children, t = e.filter((n) => !n.settings.get("_title")).map((n) => {
    var i;
    const o = (i = n.view.el) == null ? void 0 : i.cloneNode(!0);
    o.querySelectorAll(".elementor-editor-element-settings").forEach((s) => s.remove());
    let r = o.innerText.replace(/\s*\n\s*/g, `
`).replace(/[ \t]+/g, " ").trim();
    return r || (r = n.children.map((s) => s.model.get("widgetType")).join(", ")), {
      id: n.id,
      innerText: r
    };
  }).filter((n) => n.innerText);
  return {
    numOfParentContainers: e.length,
    numOfContainersToRename: t.length,
    containers: t
  };
}, tr = () => {
  const e = document.createElement("style");
  e.innerHTML = `
.${$} .elementor-navigator__element__title__text {
	color: transparent;
	width: 85px;
	position: relative;
}	

.${$} .elementor-navigator__element__title__text::before {
	content: '';
	display: block;
	position: absolute;
	top: 0;
	left: -150px;
	height: 100%;
	width: 150px;
	background: linear-gradient(255deg, rgba(217, 217, 217, 0.00) -0.81%, rgba(217, 217, 217, 0.40) 48.02%, rgba(217, 217, 217, 0.00) 100%);
	animation: ${$} 1.5s infinite;
}

.${$} .elementor-editing .elementor-navigator__element__title__text::before {
	background: linear-gradient(255deg, rgba(217, 217, 217, 0.00) -0.81%, rgba(217, 217, 217, 0.80) 48.02%, rgba(217, 217, 217, 0.00) 100%);
}

@keyframes ${$} {
	0% {
		left: -150px;
	}
	100% {
		left: 100%;
	}
}`, document.head.appendChild(e);
}, nr = (e) => {
  e.forEach((t) => {
    const n = document.querySelector('#elementor-navigator [data-id="' + t + '"]');
    n && n.classList.add($);
  });
}, Q = (e) => {
  e.forEach((t) => {
    const n = document.querySelector('#elementor-navigator [data-id="' + t + '"]');
    n && n.classList.remove($);
  });
}, or = (e, t = 3) => {
  let n = 0;
  if (e.length === 0)
    return "#" + n;
  for (let o = 0; o < e.length; o++) {
    const r = e.charCodeAt(o);
    n = (n << 5) - n + r, n = n & n;
  }
  return "#" + Math.abs(n) % Math.pow(10, t);
}, rr = (e, t = "") => {
  t || (t = or(e)), window.elementor.notifications.showToast({
    sticky: !1,
    message: `There was a glitch. Try reloading the editor and try again. (${t})`,
    buttons: [
      {
        name: "reload",
        text: "Reload",
        callback: () => {
          window.location.reload();
        }
      }
    ]
  });
}, x = {
  iframe: null,
  noticeIframe: null,
  iframeUrlObject: null,
  editorSessionId: window.EDITOR_SESSION_ID
};
var Dt = /* @__PURE__ */ ((e) => (e.PAID_REACHED = "quota_reached_subscription", e.PAID_WARNING = "quota_warning_subscription", e.TRIAL_REACHED = "quota_reached_trail", e.TRIAL_WARNING = "quota_warning_trail", e.UNKNOWN = "unknown", e))(Dt || {});
const ot = async () => {
  if (x.iframe && x.iframe.isConnected)
    return x.iframe;
  const { iframe: e, iframeUrlObject: t } = await _({
    path: "structure-titles/button",
    insertCallback: (o) => {
      var i;
      const r = document.querySelector("#elementor-navigator__toggle-all");
      (i = r == null ? void 0 : r.parentElement) == null || i.insertBefore(o, r.nextSibling);
    },
    css: {
      height: "35px",
      width: "35px"
    }
  });
  return window.jQuery(e).tipsy({
    title: () => "Rename containers with AI",
    gravity: "s"
  }), x.iframe = e, x.iframeUrlObject = t, tr(), window == null || window.addEventListener("message", async (o) => {
    var r, i, s, a, c;
    if (o.origin === t.origin && o.data.type.startsWith("structure-titles/"))
      try {
        switch (o.data.type) {
          case "structure-titles/generate":
            const l = er();
            if (!l.numOfContainersToRename) {
              k(o.ports[0], {
                message: "No containers with content found"
              }), window.elementor.notifications.showToast({
                sticky: !1,
                message: "No containers found to rename. Add some and try again.",
                buttons: [
                  {
                    name: "got-it",
                    text: "Got it"
                  }
                ]
              });
              return;
            }
            const d = {
              ...l,
              siteMetadata: {
                website: await lt(),
                page: dt()
              }
            }, w = l.containers.map((T) => T.id);
            nr(w), setTimeout(() => {
              Q(w);
            }, 1e4), p(o.ports[0], d);
            break;
          case "structure-titles/replace":
            const m = o.data.payload.titles;
            Object.entries(m).forEach(([T, V]) => {
              const R = window.elementor.getContainer(T);
              R && R.settings.set("_title", V);
            }), Q(Object.keys(m)), p(o.ports[0]);
            break;
          case "structure-titles/show-upgrade-notice":
            if ((r = x.noticeIframe) != null && r.isConnected)
              return;
            await oe(x, o.data.payload.reason, "structure-titles"), p(o.ports[0]);
            break;
          case "structure-titles/hide-upgrade-notice":
            (i = x.noticeIframe) != null && i.isConnected && x.noticeIframe.remove(), p(o.ports[0]);
            break;
          case "structure-titles/error":
            const h = o.data.payload;
            Object.values(Dt).includes((s = h.error.details) == null ? void 0 : s.message) ? oe(x, (a = h.error.details) == null ? void 0 : a.message, "structure-titles") : rr(h.error.message, (c = h.error.details) == null ? void 0 : c.error), Q(h.ids), p(o.ports[0]);
            break;
          default:
            k(o.ports[0], {
              message: "Unknown message type",
              eventData: o.data
            });
            break;
        }
      } catch (l) {
        k(o.ports[0], l);
      }
  }), x.iframe;
}, rt = "3.20.0", ir = async () => {
  var t;
  if ((await L).jwt) {
    if (!Et(rt)) {
      console.log("Structure titles is not supported in this editor version", {
        currentVersion: (t = window.elementor.config) == null ? void 0 : t.version,
        minVersion: rt
      });
      return;
    }
    ot(), window.elementor.on("document:loaded", async () => {
      ot();
    });
  }
}, jt = "e-widget-pro-promotion", sr = "e-promotion-go-pro", ar = (e, t) => {
  const n = new URL(e);
  return Object.entries(t).forEach(([o, r]) => {
    n.searchParams.append(o, r);
  }), n.toString();
}, cr = (e = {}) => ar("https://elementor.com/pro/", {
  utm_campaign: "ai-gopro",
  utm_medium: "wp-dash",
  utm_source: "element-pro-pro-widget",
  ...e
}), Ut = (e) => {
  var a, c;
  const t = e.querySelector(`.${sr}`);
  if (!t || t.getAttribute("data-saas"))
    return;
  t.setAttribute("data-saas", "true");
  const n = e.getAttribute("data-id");
  if (!n)
    return;
  const o = (a = window.elementor.getContainer(n)) == null ? void 0 : a.settings.get("ai");
  if (!o)
    return;
  const r = o.generator, i = (c = e.getAttribute("data-widget_type")) == null ? void 0 : c.replace(".default", ""), s = cr({
    utm_content: "generator-" + r,
    utm_term: i || ""
  });
  t.setAttribute("href", s);
}, J = () => {
  const e = new MutationObserver((t) => {
    var n;
    for (const o of t)
      o.type === "childList" && o.addedNodes.length && ((n = o.target.classList) != null && n.contains(jt)) && "querySelector" in o.addedNodes[0] && Ut(o.target);
  });
  return e.observe(window.elementorFrontend.elements.$body[0], {
    childList: !0,
    subtree: !0
  }), e;
}, lr = async () => {
  var e, t, n;
  (n = (t = (e = window.elementorFrontend) == null ? void 0 : e.elements) == null ? void 0 : t.$body) != null && n[0] && J(), window.$e.commands.on("run:after", (o, r, i, s) => {
    var a, c, l;
    if (r === "document/elements/create" && ((l = (c = (a = i.model) == null ? void 0 : a.settings) == null ? void 0 : c.ai) != null && l.generator)) {
      const d = s.view.el.querySelectorAll(`.${jt}`);
      d.length && setTimeout(() => {
        d.forEach((w) => {
          Ut(w);
        });
      }, 1e3);
    }
  }), window.elementor.on("document:loaded", () => {
    var o, r, i;
    (i = (r = (o = window.elementorFrontend) == null ? void 0 : o.elements) == null ? void 0 : r.$body) != null && i[0] ? J() : window.elementorFrontend.on("components:init", J);
  });
}, dr = "MuiChip-iconColorPromotion", ur = "MuiChip-labelSmall", mr = /* @__PURE__ */ new Date("2024-12-04T23:59:59"), pr = (e) => {
  const t = e.querySelector("." + ur);
  t && (t.getAttribute("data-bf") || (t.setAttribute("data-bf", "true"), t.textContent += " - Up to 25% off"));
}, fr = (e) => {
  const t = e.classList.contains("MuiDialog-root"), n = e.tagName === "HEADER" && e.classList.contains("MuiPaper-root");
  return t || n;
}, wr = () => {
  const e = new MutationObserver((t) => {
    for (const n of t)
      if (n.type === "childList" && n.addedNodes.length && fr(n.addedNodes[0]) && "querySelector" in n.addedNodes[0]) {
        const o = n.addedNodes[0].querySelector("." + dr);
        o && pr(o.parentElement);
      }
  });
  return e.observe(document.body, {
    childList: !0,
    subtree: !0
  }), e;
}, gr = () => {
  /* @__PURE__ */ new Date() > mr || wr();
};
window.$e.components.register(new Jo());
it();
qt();
kn();
Rn();
Qo();
ir();
lr();
gr();
