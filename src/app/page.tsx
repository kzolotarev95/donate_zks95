export const dynamic = "force-dynamic";

import Image from "next/image";
import { DonateWidget } from "@/components/donate-widget";
import { getGitHubProfile, getGitHubRepos, pickFeaturedRepos } from "@/lib/github";
import { buildSupportTiers, loadState, sanitizeSettingsForClient } from "@/lib/site-state";

const PROJECT_COPY: Record<string, { type: string; lang: string; description: string }> = {
  "luci-app-sub-sync666": {
    type: "LuCI plugin",
    lang: "JavaScript",
    description:
      "LuCI-плагин для Podkop Sub: подписки, мониторинг, xHTTP, HY2, URL Test и удобная работа через веб-интерфейс.",
  },
  "podkop-telegram-agent": {
    type: "Telegram agent",
    lang: "Shell",
    description:
      "Telegram-агент для OpenWrt + Podkop: статус, перезапуск, логи, backup, родительский контроль и управление VPN.",
  },
  "luci-theme-protobyzks95": {
    type: "LuCI theme",
    lang: "CSS",
    description: "Кастомная CSS-тема для LuCI-интерфейса OpenWrt: собственный визуальный стиль для веб-панели роутера.",
  },
  "luci-app-max-tg-most": {
    type: "Bridge",
    lang: "Shell",
    description: "LuCI-приложение-мост между MAX и Telegram для OpenWrt. Работает на роутере через LuCI, GREEN-API и Telegram Bot API.",
  },
  "luci-app-owrt-full-backup": {
    type: "Backup",
    lang: "OpenWrt",
    description: "Быстрый запуск полного backup OpenWrt через локальный CGI-эндпоинт роутера. Удобно держать рядом с LuCI-проектами.",
  },
  "luci-app-owrt-remote": {
    type: "Remote Hub",
    lang: "OpenWrt",
    description: "Удалённый доступ к OpenWrt через свой VPS: карточки роутеров, Online/Offline, LuCI, SSH Web Terminal, Xray Reverse и HTTPS.",
  },
};

const STACK_GROUPS = [
  ["LuCI JS", "UCI", "opkg", "init.d", "rpcd", "uhttpd", "CGI", "/cgi-bin"],
  ["Podkop", "sing-box", "nftables", "VLESS", "xHTTP", "HY2", "URL Test", "Routes"],
  ["Shell / Ash", "Telegram Bot API", "GREEN-API", "Backup", "Logs", "Monitoring", "Restart", "Status"],
  ["JavaScript", "CSS", "HTML", "LuCI Views", "Responsive UI", "CSS Theme", "Web Panel"],
  ["Telegram", "MAX", "GitHub", "Local Endpoint", "Full Backup", "Parent Control", "OpenWrt Services"],
  ["Python", "VPS Hub", "Xray Reverse", "HTTPS", "SSH Web Terminal", "Router Cards", "Online / Offline", "Heartbeat", "Doctor", "systemd", "Firewall", "Certbot"],
];

export default async function HomePage() {
  const state = await loadState();
  const profile = await getGitHubProfile(state.settings.githubUsername);
  const repos = await getGitHubRepos(state.settings.githubUsername);
  const featuredRepos = pickFeaturedRepos(repos, state.settings.featuredRepoNames);
  const tiers = buildSupportTiers(state.settings);
  const settings = sanitizeSettingsForClient(state.settings);

  return (
    <div className="site-shell" id="top">
      <a className="skip-link" href="#content">
        Перейти к контенту
      </a>

      <header className="nav">
        <div className="nav__inner">
          <a className="brand" href="#top" aria-label="kzolotarev95">
            <span className="brand__mark">KZ95</span>
            <span>kzolotarev95</span>
          </a>

          <nav className="nav__links" aria-label="Основная навигация">
            <a href="#about">Профиль</a>
            <a href="#projects">Проекты</a>
            <a href="#support">Поддержка</a>
            <a href="#stack">Стек</a>
          </nav>

          <details className="mobile-menu">
            <summary className="menu-button" aria-label="Открыть меню">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="mobile-menu__panel">
              <a href="#about">Профиль</a>
              <a href="#projects">Проекты</a>
              <a href="#support">Поддержка</a>
              <a href="#stack">Стек</a>
            </div>
          </details>
        </div>
      </header>

      <main id="content">
        <section className="hero">
          <div className="hero__content">
            <div className="hero__badge">
              <span className="status-dot" aria-hidden="true" />
              OpenWrt / LuCI / Shell
            </div>

            <h1 className="hero__title">
              Разрабатываю <span>модули OpenWrt</span>, которые удобно ставить и поддерживать.
            </h1>

            <p className="hero__text">
              Разрабатываю LuCI-приложения, shell-агенты, Telegram-автоматизацию и аккуратные интерфейсы для OpenWrt. Фокус: понятная установка, рабочие сценарии и минимум ручной возни.
            </p>

            <div className="hero__actions">
              <a className="button" href="https://github.com/kzolotarev95" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a className="button button--ghost" href="https://t.me/kzolotarev95" target="_blank" rel="noreferrer">
                Telegram
              </a>
              <a className="button button--ghost" href="#support">
                Поддержать
              </a>
            </div>

            <div className="hero__meta">
              <Metric label="LuCI" value="интерфейсы для OpenWrt" />
              <Metric label="Shell" value="установка и сервисы" />
              <Metric label="Telegram" value="управление роутером" />
              <Metric label="Podkop" value="подписки и маршруты" />
              <Metric label="Backup" value="полный backup OpenWrt" href="https://github.com/kzolotarev95/luci-app-owrt-full-backup" />
            </div>

            <div className="hero-brand-banner">
              <Image
                src="/hero-banner.svg"
                alt="Баннер kzolotarev95"
                width={1400}
                height={240}
                priority
              />
            </div>
          </div>

          <div className="hero__visual">
            <div className="profile-strip">
              <Image
                src={profile?.avatar_url || "https://avatars.githubusercontent.com/u/158571179?v=4"}
                alt="Аватар GitHub kzolotarev95"
                width={72}
                height={72}
              />
              <div>
                <a className="profile-strip__link" href="https://github.com/kzolotarev95" target="_blank" rel="noreferrer">
                  github.com/kzolotarev95
                </a>
                <span>Open-source проекты для OpenWrt, LuCI.</span>
              </div>
            </div>

            <div className="router-panel">
              <div className="router-panel__bar">
                <div className="window-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="router-panel__title">status / install.log</div>
              </div>
              <div className="router-panel__body">
                <div className="node-map">
                  <Node title="LuCI UI" tag="ok" text="Настройки без командной строки." />
                  <Node title="Podkop" tag="sync" text="Подписки, маршруты, проверки." />
                  <Node title="TG agent" tag="bot" text="Статус, логи, рестарт, backup." />
                </div>
                <pre className="log" aria-label="Лог установки пакетов">
                  <code id="install-log" aria-live="off">
root@router:~# opkg update{"\n"}
root@router:~# opkg install luci-app-owrt-full-backup luci-app-sub-sync666 luci-app-max-tg-most luci-theme-protobyzks95 podkop-telegram-agent luci-app-owrt-remote{"\n"}
fetch github.com/kzolotarev95/luci-app-owrt-full-backup{"\n"}
fetch github.com/kzolotarev95/luci-app-sub-sync666{"\n"}
fetch github.com/kzolotarev95/luci-app-max-tg-most{"\n"}
fetch github.com/kzolotarev95/luci-theme-protobyzks95{"\n"}
fetch github.com/kzolotarev95/podkop-telegram-agent{"\n"}
fetch github.com/kzolotarev95/luci-app-owrt-remote{"\n"}
verify 6 packages from github.com/kzolotarev95{"\n"}
done. web ui ready
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <div className="section__head">
            <span className="eyebrow">Профиль</span>
            <h2>Разработка под OpenWrt: интерфейсы, сервисы и автоматизация.</h2>
          </div>

          <div className="about">
            <div className="about__text">
              <p>
                Специализируюсь на модулях для <strong>OpenWrt и LuCI</strong>: веб-интерфейсы, фоновые сервисы, установочные скрипты, интеграции с Telegram и сценарии для управления сетевыми сервисами.
              </p>
              <p>
                Аккаунт: <a href="https://github.com/kzolotarev95" target="_blank" rel="noreferrer">kzolotarev95</a>
              </p>
            </div>

            <div className="capability-list">
              <Capability title="LuCI-приложения" text="Интерфейсы для настройки сервисов прямо из веб-панели OpenWrt." />
              <Capability title="Shell-автоматизация" text="Установка, обновление, backup, перезапуск и контроль состояния сервисов." />
              <Capability title="Telegram-управление" text="Боты и агенты для статуса, логов, команд и контроля роутера удаленно." />
            </div>
          </div>
        </section>

        <section className="section section--tight" id="projects">
          <div className="section__head">
            <span className="eyebrow">Проекты</span>
            <h2>Публичные репозитории, вокруг которых собрана страница.</h2>
            <p className="lead">Карточки ведут на GitHub и показывают актуальные звёзды каждого репозитория.</p>
          </div>

          <div className="project-grid">
            {featuredRepos.map((repo, index) => {
              const meta = PROJECT_COPY[repo.name] ?? {
                type: "Repository",
                lang: repo.language || "Code",
                description: repo.description || "Open source project from my GitHub.",
              };

              return (
                <article key={repo.name} className="project-card">
                  <div className="project-card__top">
                    <div className="project-card__top-left">
                      <div className="project-icon" aria-hidden="true">
                        <IconForProject index={index} />
                      </div>
                      {index === 0 ? <span className="popular-badge">Популярный</span> : null}
                    </div>
                    <span className="project-card__type">{meta.type}</span>
                  </div>
                  <div className="project-card__body">
                    <h3>{repo.name}</h3>
                    <p>{meta.description}</p>
                  </div>
                  <div className="project-card__foot">
                    <span className={`lang ${meta.lang.toLowerCase().includes("css") ? "lang--css" : meta.lang.toLowerCase().includes("javascript") ? "lang--js" : ""}`}>
                      {meta.lang}
                    </span>
                    <div className="project-action">
                      <a className="link-arrow" href={repo.html_url} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                      <span className="stars">★ {repo.stargazers_count}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="section section--tight" id="support">
          <div className="section__head">
            <span className="eyebrow">Поддержка</span>
            <h2>Поддержать разработку и провести платёж через YooKassa.</h2>
          </div>

          <div className="support-grid">
            <div className="flow-card">
              <pre>{FLOW_DIAGRAM}</pre>
            </div>

            <DonateWidget tiers={tiers} supportNote={settings.supportNote} />
          </div>
        </section>

        <section className="section section--tight section--final" id="stack">
          <div className="section__head">
            <span className="eyebrow">Стек</span>
            <h2>Инструменты, из которых собираются проекты.</h2>
          </div>

          <div className="stack-layout">
            {STACK_GROUPS.map((group, index) => (
              <div key={index} className="stack-group">
                <h3>{STACK_TITLES[index]}</h3>
                <div className="chips">
                  {group.map((chip) => (
                    <span key={chip} className="chip">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

const STACK_TITLES = ["OpenWrt", "Network / VPN", "Automation", "Frontend / UI", "Integrations", "Remote Hub / VPS"];

const FLOW_DIAGRAM = `┌─────────────────────────────────────────┐
│         ❤️ Поддержать разработку        │
│                                         │
│ Если мои Open Source проекты оказались  │
│ полезны — поддержите их развитие.       │
│                                         │
│           Выберите сумму:               │
│                                         │
│   [ 500 ₽ ]    [ 1 500 ₽ ]              │
│                                         │
│   [ 3 000 ₽ ]  [ 5 000 ₽ ]              │
│                                         │
│   [ 10 000 ₽ ]                           │
│                                         │
│   Другая сумма: [ _________ ₽ ]         │
│                                         │
│      [ ❤️ Поддержать разработку ]       │
└──────────────────────┬──────────────────┘
                       │
                       ▼
              Выбрано: 3 000 ₽
                       │
                       ▼
                 Твой Backend
                       │
                       ▼
            Создание платежа ЮKassa
                       │
                       ▼
                ЮKassa Checkout
                       │
                       ▼
                💳 Оплата 3 000 ₽
                       │
                       ▼
               Webhook от ЮKassa
                       │
                       ▼
           Backend проверяет платёж
                       │
                ┌─────┴─────┐
                │           │
            Успешно       Ошибка
                │           │
                ▼           ▼
       «Спасибо ❤️»    «Оплата не прошла»`;

function Metric({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <strong>{label}</strong>
      <span>{value}</span>
    </>
  );

  return href ? (
    <a className="metric" href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  ) : (
    <div className="metric">{content}</div>
  );
}

function Node({ title, tag, text }: { title: string; tag: string; text: string }) {
  return (
    <div className="node">
      <div className="node__top">
        <span className="node__name">{title}</span>
        <span className="tag">{tag}</span>
      </div>
      <p>{text}</p>
    </div>
  );
}

function Capability({ title, text }: { title: string; text: string }) {
  return (
    <article className="capability">
      <div className="capability__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z" stroke="currentColor" strokeWidth="2" />
          <path d="M8 9h8M8 13h5M8 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function IconForProject({ index }: { index: number }) {
  const icons = [
    <path key="1" d="M17 3v5h-5M7 21v-5h5M19 10a7 7 0 0 0-12.2-4.7L5 7M5 14a7 7 0 0 0 12.2 4.7L19 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    <path key="2" d="M8 10V8a4 4 0 1 1 8 0v2M6 10h12a2 2 0 0 1 2 2v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />,
    <path key="3" d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H13a1.5 1.5 0 0 1 0-3h1a7 7 0 0 0 0-14h-2Z" stroke="currentColor" strokeWidth="2" />,
    <path key="4" d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="2" />,
    <path key="5" d="M12 3 5 6v5c0 4.6 2.9 8.3 7 10 4.1-1.7 7-5.4 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="2" />,
    <path key="6" d="M4 7h16M7 4v6M17 4v6M6 14h12M9 17h6" stroke="currentColor" strokeWidth="2" />,
  ];

  return <svg viewBox="0 0 24 24" fill="none">{icons[index % icons.length]}</svg>;
}
