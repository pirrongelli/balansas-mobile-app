{
  "brand": {
    "name": "Balansas",
    "positioning": [
      "premium",
      "secure",
      "fast cross-border",
      "native-mobile-feel",
      "business-ready"
    ],
    "mood_keywords": [
      "deep-night",
      "glass-dark",
      "teal-ink accents",
      "precise typography",
      "calm confidence"
    ],
    "logo": {
      "url": "https://sandbox.balansas.com/assets/balansas-logo-B5IOxKL2.png",
      "usage": "Use full logo in auth screens and Settings. Use compact mark (or text Balansas) in app header on mobile. Never tint logo with gradients."
    }
  },

  "visual_style": {
    "style_fusion": {
      "layout_principle": "Native mobile banking (iOS-like safe areas, bottom tabs, large tap targets)",
      "surface_treatment": "Dark glass + subtle borders (1px) + soft inner highlights (avoid heavy shadows)",
      "data_density": "High information density but with strong hierarchy, progressive disclosure, and sticky filters",
      "accent_strategy": "One primary accent (teal) + semantic status colors; keep accents sparse to preserve premium feel"
    },
    "layout": {
      "app_shell": {
        "max_width": "max-w-[480px] (centered only on large screens via outer wrapper; internal content left-aligned)",
        "safe_area": "Use padding-bottom to account for bottom tabs and iOS home indicator (pb-[88px] on mobile)",
        "page_header": "Sticky top header with blur (back button / title / optional actions). Height 56px."
      },
      "grid": {
        "mobile": "1-col, 16px side padding, 12-16px vertical rhythm",
        "tablet": "2-col where appropriate (Accounts list + details), 24px padding",
        "desktop": "3-col dashboards allowed but keep the mobile-first max-width shell for banking flow simplicity"
      }
    }
  },

  "typography": {
    "google_fonts": {
      "primary": {
        "name": "Space Grotesk",
        "weights": ["400", "500", "600", "700"],
        "usage": "Headings, balance figures, tab labels"
      },
      "secondary": {
        "name": "Inter",
        "weights": ["400", "500", "600"],
        "usage": "Body, forms, tables, helper text"
      },
      "import_notes": "Add <link> tags in public/index.html or use @import in index.css; prefer <link> for performance."
    },
    "scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg font-medium text-[hsl(var(--muted-foreground))]",
      "section_title": "text-sm font-semibold tracking-wide text-[hsl(var(--foreground))]",
      "body": "text-sm md:text-base text-[hsl(var(--foreground))] leading-relaxed",
      "caption": "text-xs text-[hsl(var(--muted-foreground))]"
    },
    "numeric": {
      "balance_numbers": "Use tabular-nums (Tailwind: tabular-nums) + font-semibold",
      "currency_format": "Render as 'CUR X,XXX.XX' and keep currency code visually smaller (text-xs) next to amount"
    }
  },

  "color_system": {
    "notes": [
      "Dark theme is mandatory; use near-black navy as base for a premium banking feel.",
      "Avoid purple. Use teal/mint/ocean accents.",
      "Keep gradients decorative and under 20% viewport; never on reading-heavy areas."
    ],
    "tokens_css": {
      "where": "/app/frontend/src/index.css (override :root and .dark tokens)",
      "recommended_hsl_tokens": {
        "dark": {
          "--background": "222 47% 6%",
          "--foreground": "210 40% 98%",
          "--card": "222 45% 8%",
          "--card-foreground": "210 40% 98%",
          "--popover": "222 45% 8%",
          "--popover-foreground": "210 40% 98%",
          "--primary": "188 86% 50%",
          "--primary-foreground": "222 47% 6%",
          "--secondary": "220 20% 14%",
          "--secondary-foreground": "210 40% 98%",
          "--muted": "220 18% 14%",
          "--muted-foreground": "215 18% 72%",
          "--accent": "220 18% 14%",
          "--accent-foreground": "210 40% 98%",
          "--border": "220 18% 18%",
          "--input": "220 18% 18%",
          "--ring": "188 86% 50%",
          "--destructive": "0 84% 60%",
          "--destructive-foreground": "210 40% 98%",
          "--radius": "0.9rem"
        },
        "additional_custom_properties": {
          "--app-shell": "222 47% 6%",
          "--surface-1": "222 45% 8%",
          "--surface-2": "221 22% 12%",
          "--surface-glass": "222 45% 8%",
          "--text-1": "210 40% 98%",
          "--text-2": "215 18% 72%",
          "--text-3": "215 16% 58%",
          "--accent-teal": "188 86% 50%",
          "--accent-mint": "142 70% 63%",
          "--status-success": "142 70% 55%",
          "--status-warning": "38 92% 55%",
          "--status-danger": "0 84% 60%",
          "--provider-eu": "188 86% 50%",
          "--provider-us": "160 84% 45%",
          "--focus": "188 86% 50%",
          "--shadow-soft": "0 0% 0%",
          "--shadow-color": "222 47% 2%"
        }
      },
      "hex_reference": {
        "bg": "#070B14",
        "surface": "#0B1220",
        "surface2": "#0F1B2D",
        "border": "#1B2A40",
        "teal": "#22D3EE",
        "mint": "#34D399",
        "text": "#EAF2FF",
        "muted": "#A9B6CC",
        "warning": "#F59E0B",
        "danger": "#EF4444"
      }
    },
    "provider_badges": {
      "eu_rails": {
        "label": "EU Rails",
        "bg_class": "bg-[hsl(var(--provider-eu)/0.12)]",
        "text_class": "text-[hsl(var(--provider-eu))]",
        "border_class": "border-[hsl(var(--provider-eu)/0.25)]"
      },
      "us_rails": {
        "label": "US Rails",
        "bg_class": "bg-[hsl(var(--provider-us)/0.12)]",
        "text_class": "text-[hsl(var(--provider-us))]",
        "border_class": "border-[hsl(var(--provider-us)/0.25)]"
      }
    },
    "transaction_status": {
      "completed": {
        "dot": "bg-[hsl(var(--status-success))]",
        "badge": "bg-[hsl(var(--status-success)/0.12)] text-[hsl(var(--status-success))] border-[hsl(var(--status-success)/0.25)]"
      },
      "processing": {
        "dot": "bg-[hsl(var(--status-warning))]",
        "badge": "bg-[hsl(var(--status-warning)/0.12)] text-[hsl(var(--status-warning))] border-[hsl(var(--status-warning)/0.25)]"
      },
      "failed": {
        "dot": "bg-[hsl(var(--status-danger))]",
        "badge": "bg-[hsl(var(--status-danger)/0.12)] text-[hsl(var(--status-danger))] border-[hsl(var(--status-danger)/0.25)]"
      }
    }
  },

  "gradients_and_texture": {
    "rules": {
      "max_viewport_coverage": "<= 20%",
      "placement": "Only as decorative overlays (hero/auth header blob, dashboard top glow). Never behind long lists/table text.",
      "prohibited": "No saturated purple/pink/blue-to-purple combos. No gradients on small UI elements (<100px)."
    },
    "approved_gradients": [
      {
        "name": "Teal Fog",
        "css": "radial-gradient(600px circle at 20% 0%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(500px circle at 80% 10%, rgba(52,211,153,0.12), transparent 60%)",
        "usage": "Top-of-screen glow for Auth + Dashboard header only"
      },
      {
        "name": "Ink Edge",
        "css": "linear-gradient(180deg, rgba(255,255,255,0.06), transparent 35%)",
        "usage": "Subtle card sheen (use as ::before overlay)"
      }
    ],
    "noise": {
      "css_snippet": ".noise:before{content:'';position:absolute;inset:0;background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22120%22 height=%22120%22 filter=%22url(%23n)%22 opacity=%220.14%22/%3E%3C/svg%3E');mix-blend-mode:overlay;pointer-events:none;border-radius:inherit;}",
      "usage": "Add to header surfaces / hero blocks only (keep subtle)."
    }
  },

  "components": {
    "component_path": {
      "buttons": "/app/frontend/src/components/ui/button.jsx",
      "inputs": "/app/frontend/src/components/ui/input.jsx",
      "otp": "/app/frontend/src/components/ui/input-otp.jsx",
      "cards": "/app/frontend/src/components/ui/card.jsx",
      "badges": "/app/frontend/src/components/ui/badge.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "tables": "/app/frontend/src/components/ui/table.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "sheet_drawer": "/app/frontend/src/components/ui/sheet.jsx and /app/frontend/src/components/ui/drawer.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "dropdown": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "select": "/app/frontend/src/components/ui/select.jsx",
      "calendar": "/app/frontend/src/components/ui/calendar.jsx",
      "toast": "/app/frontend/src/components/ui/sonner.jsx"
    },
    "buttons": {
      "shape": "Professional / Corporate: medium radius (10-12px via --radius 0.9rem), confident, tactile",
      "variants": {
        "primary": {
          "className": "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.92)] focus-visible:ring-[hsl(var(--ring))]",
          "use": "Primary actions: Continue, Create payment, Save"
        },
        "secondary": {
          "className": "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary)/0.85)]",
          "use": "Less prominent actions"
        },
        "ghost": {
          "className": "bg-transparent hover:bg-[hsl(var(--accent))]",
          "use": "Icon buttons in headers, list row actions"
        },
        "destructive": {
          "className": "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:bg-[hsl(var(--destructive)/0.92)]",
          "use": "Remove payee/team member"
        }
      },
      "micro_interactions": {
        "hover": "Translate none; only subtle brightness + border emphasis (avoid jumpy motion in finance)",
        "press": "active:scale-[0.98] transition-[background-color,box-shadow,opacity] duration-150",
        "loading": "Use inline spinner + disable; keep label visible"
      },
      "data_testid": "All buttons must include data-testid, e.g., data-testid='create-payment-submit-button'"
    },
    "forms": {
      "pattern": "Use shadcn Form + Input + Label; errors below field; MFA uses InputOTP",
      "mfa": {
        "otp_component": "InputOTP",
        "layout": "6 cells; auto-advance; paste support; numeric keyboard (inputMode='numeric')",
        "helper": "Show timer + 'Resend code' ghost button"
      }
    },
    "navigation": {
      "bottom_tabs": {
        "tabs": ["Dashboard", "Accounts", "Transactions", "Payments", "More"],
        "behavior": [
          "Fixed bottom bar with blur and subtle border",
          "Active tab: teal icon + label; inactive: muted",
          "Hide on auth screens"
        ],
        "tailwind": "fixed bottom-0 inset-x-0 z-50 border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.72)] backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--card)/0.58)]",
        "tap_target": "min-h-[56px], icons 22-24px"
      },
      "top_header": {
        "behavior": "Sticky; left: back button; center: title; right: actions (filter, add)",
        "tailwind": "sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.75)] backdrop-blur"
      }
    },
    "cards_and_lists": {
      "balance_card": {
        "layout": "Large total balance + segmented chips for currency; secondary row: available vs pending; CTA: 'Add money'/'Send'",
        "surface": "Card with subtle sheen ::before and thin border",
        "tailwind": "relative overflow-hidden rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-[0_10px_30px_hsl(var(--shadow-color)/0.35)]",
        "numbers": "text-2xl font-semibold tabular-nums"
      },
      "account_row": {
        "pattern": "Left: currency flag circle (2 letters) + account name; Middle: provider badge; Right: amount",
        "row_interaction": "Entire row clickable; show chevron; active/pressed highlight",
        "tailwind": "flex items-center justify-between gap-3 rounded-xl px-3 py-3 hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent)/0.7)]"
      },
      "transaction_row": {
        "pattern": "Left: direction icon (in/out) + counterparty; Middle: status badge; Right: signed amount + date",
        "states": "Pending shows amber dot + 'Processing' badge",
        "tailwind": "flex items-start justify-between gap-3 rounded-xl px-3 py-3 hover:bg-[hsl(var(--accent))]"
      }
    },
    "filters_search": {
      "transaction_filters": {
        "components": ["Tabs", "Select", "Popover", "Calendar"],
        "behavior": "Sticky filter bar under header; quick chips for Completed/Pending/Failed; advanced filters in Sheet",
        "search": "Use Input with leading icon; debounce 250ms"
      }
    },
    "tables": {
      "business_tables": "Team Members management uses Table on >= md; on mobile, render as stacked cards"
    },
    "feedback_states": {
      "skeleton": {
        "use": "Account lists, balance header, tx rows",
        "component": "Skeleton",
        "pattern": "Shimmer-lite on dark (avoid bright shimmer)"
      },
      "empty": {
        "tone": "Calm and action-oriented",
        "cta": "Primary button only",
        "copy_examples": [
          "No transactions yet. Your activity will show up here.",
          "No payees saved. Add a payee to send faster."
        ]
      },
      "error": {
        "pattern": "Inline Alert + Retry button; keep technical details collapsible",
        "component": "Alert"
      },
      "toast": {
        "library": "sonner",
        "use_cases": ["Copied to clipboard", "Payment created", "Session expired"],
        "placement": "Top-center on mobile"
      }
    }
  },

  "page_blueprints": {
    "auth_login": {
      "layout": "Logo + headline, form card, security note, help link",
      "details": [
        "Use one-column layout with a decorative top glow (<=20% viewport)",
        "Email/password fields + 'Continue' primary button",
        "Secondary: 'Use recovery code' (ghost)"
      ],
      "testids": {
        "email": "login-email-input",
        "password": "login-password-input",
        "submit": "login-submit-button"
      }
    },
    "mfa_verify": {
      "layout": "Title + masked email + InputOTP + verify button + resend",
      "testids": {
        "otp": "mfa-otp-input",
        "verify": "mfa-verify-button",
        "resend": "mfa-resend-button"
      }
    },
    "dashboard": {
      "sections": [
        "Top: total balance card (with currency chip selector)",
        "Quick actions row (Send, Request, Add Payee) as icon buttons",
        "Recent transactions preview (5 items) + 'View all'"
      ],
      "pull_to_refresh": "Implement touch pull-to-refresh using a lightweight library or custom handler (see libraries section)."
    },
    "accounts_list": {
      "tabs": ["Fiat", "Crypto"],
      "provider_visibility": "Fiat can show both EU + US; Crypto only US Rails. Provider badge always visible per row.",
      "cta": "Add account / Link provider as a floating action button on mobile (only if supported)."
    },
    "account_detail": {
      "sections": [
        "Balance header",
        "Bank details card (IBAN/Account/Routing) with copy-to-clipboard rows",
        "Recent activity list"
      ],
      "copy_rows": "Use Button ghost icon; show sonner toast 'Copied'."
    },
    "transactions": {
      "filtering": [
        "Search input",
        "Status chips",
        "Date range (Calendar in Popover/Sheet)",
        "Provider filter (EU/US)"
      ],
      "infinite_scroll": "Prefer paginated with 'Load more' button to avoid scroll-jank on mobile web."
    },
    "create_payment": {
      "wizard": {
        "steps": ["Select payee", "Amount & currency", "Review", "Confirm"],
        "component": "Tabs or custom stepper; on mobile use top progress bar (Progress component)",
        "safety": "Show fees + ETA + provider before confirm"
      },
      "testids": {
        "amount": "payment-amount-input",
        "currency": "payment-currency-select",
        "submit": "payment-confirm-button"
      }
    },
    "payees": {
      "list": "Search + list rows with avatar initials + bank/country detail",
      "create": "Use Dialog on desktop, Sheet on mobile",
      "testids": {
        "create": "payees-create-button",
        "search": "payees-search-input"
      }
    },
    "team_members": {
      "pattern": "Members list with role badge + invite flow",
      "actions": "Invite (primary), change role (Select), remove (destructive)"
    }
  },

  "motion_and_microinteractions": {
    "principles": [
      "Motion should communicate state change, not decoration.",
      "Keep transitions short (120–200ms) and consistent.",
      "Avoid large translate animations on financial numbers (can feel untrustworthy)."
    ],
    "recommended_library": {
      "name": "framer-motion",
      "install": "npm i framer-motion",
      "usage": [
        "Page transitions: fade + slight blur",
        "Bottom tab active indicator: spring underline",
        "Skeleton -> content reveal: opacity crossfade"
      ],
      "js_snippet": "import { motion, AnimatePresence } from 'framer-motion';\n\nexport function PageTransition({ children, routeKey }) {\n  return (\n    <AnimatePresence mode='wait'>\n      <motion.div\n        key={routeKey}\n        initial={{ opacity: 0, filter: 'blur(6px)' }}\n        animate={{ opacity: 1, filter: 'blur(0px)' }}\n        exit={{ opacity: 0, filter: 'blur(6px)' }}\n        transition={{ duration: 0.18 }}\n      >\n        {children}\n      </motion.div>\n    </AnimatePresence>\n  );\n}"
    },
    "pull_to_refresh": {
      "option_a_library": {
        "name": "react-simple-pull-to-refresh",
        "install": "npm i react-simple-pull-to-refresh",
        "usage": "Wrap the main scroll container; show a small spinner and 'Updating…'."
      },
      "option_b_custom": "If avoiding libs, implement touchstart/move with threshold + setRefreshing state; keep it minimal to avoid scroll bugs."
    }
  },

  "data_viz": {
    "library": {
      "name": "recharts",
      "install": "npm i recharts",
      "use_cases": [
        "Mini sparkline in balance card",
        "Spending breakdown (optional)"
      ]
    },
    "chart_style": {
      "grid": "Very subtle (stroke hsl(var(--border)))",
      "line": "Teal (hsl(var(--accent-teal)))",
      "tooltip": "Dark card popover with border + blur"
    }
  },

  "accessibility": {
    "wcag": [
      "Maintain WCAG AA for text contrast.",
      "Never use color alone for status; always pair with text/icon.",
      "Focus states must be visible (ring uses --focus)."
    ],
    "keyboard": [
      "Bottom tabs must be keyboard reachable.",
      "Dialogs/Sheets must trap focus (shadcn handles)."
    ],
    "reduced_motion": "Respect prefers-reduced-motion: disable page blur transitions and springy animations.",
    "tap_targets": "Minimum 44x44px for primary touch controls."
  },

  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid (kebab-case).",
    "examples": [
      "data-testid='bottom-tab-dashboard'",
      "data-testid='accounts-provider-badge'",
      "data-testid='transaction-status-badge'",
      "data-testid='account-balance-amount'",
      "data-testid='copy-iban-button'"
    ]
  },

  "image_urls": {
    "background_textures": [
      {
        "url": "https://images.unsplash.com/photo-1651499833046-a21523397971?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHw0fHxkYXJrJTIwZmludGVjaCUyMGFwcCUyMFVJJTIwYmFja2dyb3VuZCUyMHRleHR1cmV8ZW58MHx8fGJsdWV8MTc3MTE2MTQwOXww&ixlib=rb-4.1.0&q=85",
        "category": "decorative",
        "description": "Use as very subtle (opacity 0.06–0.10) texture overlay in Auth header only"
      },
      {
        "url": "https://images.unsplash.com/flagged/photo-1573752434924-1c7100f2c54d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZmludGVjaCUyMGFwcCUyMFVJJTIwYmFja2dyb3VuZCUyMHRleHR1cmV8ZW58MHx8fGJsdWV8MTc3MTE2MTQwOXww&ixlib=rb-4.1.0&q=85",
        "category": "decorative",
        "description": "Alternative abstract texture for dashboard top glow background"
      }
    ],
    "abstract_mesh": [
      {
        "url": "https://images.unsplash.com/photo-1539689270979-e88c4ee12804?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwbWVzaCUyMHN1YnRsZSUyMHRlYWwlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8dGVhbHwxNzcxMTYxNDEwfDA&ixlib=rb-4.1.0&q=85",
        "category": "decorative",
        "description": "Use blurred + darkened as a background layer for Auth screens only (keep under 20% viewport)"
      }
    ]
  },

  "instructions_to_main_agent": {
    "implementation_priorities": [
      "1) Replace default shadcn dark tokens in index.css with the recommended token set (teal accent).",
      "2) Remove App.css centered header patterns; use Tailwind layout wrappers instead. Avoid .App { text-align:center }.",
      "3) Build a mobile AppShell with: sticky top header + scroll container + fixed bottom tabs (safe-area padding).",
      "4) Use shadcn Skeleton for all list pages and balance header; ensure smooth crossfade on load.",
      "5) Add data-testid to all buttons/inputs/navigation elements and key numbers (balances, statuses).",
      "6) Use Sonner for toasts (copy-to-clipboard, success/error), and Alerts for blocking errors.",
      "7) Implement session timeout UX: toast warning at 29:00 + auto logout modal at 30:00."
    ],
    "js_file_convention": "All new components/pages should be written in .js (not .tsx). Use named exports for components, default export for pages.",
    "do_not": [
      "Do not use HTML-native dropdown/calendar/toast. Always use shadcn components.",
      "Do not use universal transition (transition-all).",
      "Do not use large gradients or gradients on lists/tables.",
      "Do not animate balances with bouncy motion."
    ]
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>\n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
