-- =====================================================================
-- THE MAZE MAN COMICS — SUPABASE PHASE 1 MIGRATION
-- Tables: profiles, comics, episodes, panels, subscriptions, purchases,
--         credits, transactions, ad_views, error_logs,
--         rate_limits, user_episode_access
-- RLS on every table | Helper functions | Triggers | Storage buckets
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================================

-- ── Extensions ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- TABLE 1: profiles
-- One row per auth user — created automatically on signup via trigger
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username        TEXT UNIQUE,
    display_name    TEXT,
    avatar_emoji    TEXT    DEFAULT '🧠',
    avatar_url      TEXT,
    bio             TEXT,
    xp_points       INTEGER DEFAULT 0   CHECK (xp_points >= 0),
    level           INTEGER DEFAULT 1   CHECK (level >= 1),
    streak_days     INTEGER DEFAULT 0   CHECK (streak_days >= 0),
    last_visit_date DATE,
    comics_read     INTEGER DEFAULT 0,
    videos_watched  INTEGER DEFAULT 0,
    puzzles_solved  INTEGER DEFAULT 0,
    preferred_lang  TEXT    DEFAULT 'en' CHECK (preferred_lang IN ('en','ar')),
    is_premium      BOOLEAN DEFAULT FALSE,
    is_admin        BOOLEAN DEFAULT FALSE,
    is_banned       BOOLEAN DEFAULT FALSE,
    ban_reason      TEXT,
    failed_login_count  INTEGER DEFAULT 0,
    last_failed_login   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 2: comics
-- Comic series / volumes
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.comics (
    id              UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug            TEXT    UNIQUE NOT NULL,
    title           TEXT    NOT NULL,
    title_ar        TEXT,
    description     TEXT,
    description_ar  TEXT,
    cover_url       TEXT,
    category        TEXT    NOT NULL CHECK (category IN ('social','cognitive','neuro','depth')),
    total_episodes  INTEGER DEFAULT 0,
    is_published    BOOLEAN DEFAULT FALSE,
    is_featured     BOOLEAN DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 3: episodes
-- Individual comic issues inside a series
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.episodes (
    id                  UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    comic_id            UUID    REFERENCES public.comics(id) ON DELETE CASCADE NOT NULL,
    episode_number      INTEGER NOT NULL,
    title               TEXT    NOT NULL,
    title_ar            TEXT,
    description         TEXT,
    description_ar      TEXT,
    cover_url           TEXT,
    -- free = always free | ad_supported = free with ads | premium = paid
    access_tier         TEXT    DEFAULT 'premium'
                                CHECK (access_tier IN ('free','ad_supported','premium')),
    credit_cost         INTEGER DEFAULT 1,
    total_panels        INTEGER DEFAULT 0,
    reading_time_mins   INTEGER DEFAULT 5,
    is_published        BOOLEAN DEFAULT FALSE,
    published_at        TIMESTAMPTZ,
    sort_order          INTEGER DEFAULT 0,
    view_count          INTEGER DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(comic_id, episode_number)
);

-- =====================================================================
-- TABLE 4: panels
-- Individual comic panels — images stored in private Storage bucket
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.panels (
    id              UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    episode_id      UUID    REFERENCES public.episodes(id) ON DELETE CASCADE NOT NULL,
    panel_number    INTEGER NOT NULL,
    storage_path    TEXT    NOT NULL,   -- path in 'comic-panels' private bucket
    alt_text        TEXT,
    alt_text_ar     TEXT,
    panel_type      TEXT    DEFAULT 'image' CHECK (panel_type IN ('image','text','mixed')),
    panel_text      TEXT,
    panel_text_ar   TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(episode_id, panel_number)
);

-- =====================================================================
-- TABLE 5: subscriptions
-- Active / past subscription records per user
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                      UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id                 UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan                    TEXT    NOT NULL CHECK (plan IN ('monthly','yearly')),
    status                  TEXT    NOT NULL DEFAULT 'active'
                                    CHECK (status IN ('active','cancelled','expired','paused','past_due')),
    gateway                 TEXT    NOT NULL
                                    CHECK (gateway IN ('tap','stripe','google_play','apple_store')),
    gateway_subscription_id TEXT,
    gateway_customer_id     TEXT,
    current_period_start    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end      TIMESTAMPTZ NOT NULL,
    cancelled_at            TIMESTAMPTZ,
    cancel_at_period_end    BOOLEAN DEFAULT FALSE,
    amount_usd              NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency                TEXT    DEFAULT 'USD',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 6: purchases
-- One-time purchases of episodes, arcs, or credit packs
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.purchases (
    id                  UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id             UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_type           TEXT    NOT NULL
                                CHECK (item_type IN ('episode','comic_arc','credit_pack')),
    item_id             UUID,
    item_ref            TEXT,
    gateway             TEXT    NOT NULL
                                CHECK (gateway IN ('tap','stripe','google_play','apple_store','credits')),
    gateway_payment_id  TEXT,
    amount_usd          NUMERIC(10,2),
    currency            TEXT    DEFAULT 'USD',
    status              TEXT    DEFAULT 'pending'
                                CHECK (status IN ('pending','completed','failed','refunded')),
    verified_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 7: credits
-- Credit wallet — one row per user
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.credits (
    id            UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id       UUID    REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance       INTEGER DEFAULT 0 CHECK (balance >= 0),
    total_earned  INTEGER DEFAULT 0,
    total_spent   INTEGER DEFAULT 0,
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 8: transactions
-- Full immutable audit trail of all money/credit movements
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id                  UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id             UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
    transaction_type    TEXT    NOT NULL
                                CHECK (transaction_type IN (
                                    'credit_purchase','credit_spend','credit_refund',
                                    'subscription_charge','one_time_purchase',
                                    'ad_reward','signup_bonus','refund'
                                )),
    amount_usd          NUMERIC(10,2),
    currency            TEXT    DEFAULT 'USD',
    credits_delta       INTEGER DEFAULT 0,
    balance_after       INTEGER,
    description         TEXT,
    reference_id        UUID,
    gateway             TEXT,
    gateway_ref         TEXT,
    status              TEXT    DEFAULT 'completed'
                                CHECK (status IN ('pending','completed','failed','reversed')),
    metadata            JSONB   DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 9: ad_views
-- Track ad impressions for analytics and revenue estimation
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.ad_views (
    id                UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id           UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id        TEXT,
    ad_unit           TEXT,
    ad_provider       TEXT    DEFAULT 'placeholder',
    episode_id        UUID    REFERENCES public.episodes(id) ON DELETE SET NULL,
    viewed_at         TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds  INTEGER,
    completed         BOOLEAN DEFAULT FALSE,
    revenue_usd       NUMERIC(10,4) DEFAULT 0
);

-- =====================================================================
-- TABLE 10: error_logs
-- All JS errors, failed payments, auth failures captured silently
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
    id            UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id       UUID    REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id    TEXT,
    error_type    TEXT    NOT NULL
                          CHECK (error_type IN (
                              'js_error','payment_failed','auth_failure',
                              'episode_load_failed','api_error','rate_limit','other'
                          )),
    error_message TEXT,
    error_stack   TEXT,
    error_code    TEXT,
    page_url      TEXT,
    user_agent    TEXT,
    severity      TEXT    DEFAULT 'error'
                          CHECK (severity IN ('info','warning','error','critical')),
    resolved      BOOLEAN DEFAULT FALSE,
    metadata      JSONB   DEFAULT '{}',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- TABLE 11: rate_limits
-- Per-user, per-action call counting for abuse prevention
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id            UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id       UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address    TEXT,
    action        TEXT    NOT NULL,
    window_start  TIMESTAMPTZ DEFAULT date_trunc('hour', NOW()),
    call_count    INTEGER DEFAULT 1,
    UNIQUE(user_id, action, window_start)
);

-- =====================================================================
-- TABLE 12: user_episode_access
-- Granted access records — subscription, purchase, or credit unlock
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_episode_access (
    id           UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id      UUID    REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    episode_id   UUID    REFERENCES public.episodes(id) ON DELETE CASCADE NOT NULL,
    access_type  TEXT    NOT NULL
                         CHECK (access_type IN ('free','subscription','purchase','credit')),
    granted_at   TIMESTAMPTZ DEFAULT NOW(),
    expires_at   TIMESTAMPTZ,   -- NULL = permanent
    UNIQUE(user_id, episode_id)
);

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_xp          ON public.profiles(xp_points DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_comic       ON public.episodes(comic_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_episodes_published   ON public.episodes(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_panels_episode       ON public.panels(episode_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_subs_user_status     ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_user       ON public.purchases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user    ON public.transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_views_user        ON public.ad_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_type      ON public.error_logs(error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity  ON public.error_logs(severity, resolved);
CREATE INDEX IF NOT EXISTS idx_access_user_ep       ON public.user_episode_access(user_id, episode_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup   ON public.rate_limits(user_id, action, window_start);

-- =====================================================================
-- TRIGGER: auto-set updated_at on row changes
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_comics_updated_at
    BEFORE UPDATE ON public.comics
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_episodes_updated_at
    BEFORE UPDATE ON public.episodes
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_subs_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_credits_updated_at
    BEFORE UPDATE ON public.credits
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- =====================================================================
-- TRIGGER: auto-create profile + credit wallet on new user signup
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_on_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, display_name, avatar_emoji)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
        '🧠'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create credit wallet with 3 signup bonus credits
    INSERT INTO public.credits (user_id, balance, total_earned)
    VALUES (NEW.id, 3, 3)
    ON CONFLICT (user_id) DO NOTHING;

    -- Log signup bonus transaction
    INSERT INTO public.transactions
        (user_id, transaction_type, credits_delta, balance_after, description, status)
    VALUES
        (NEW.id, 'signup_bonus', 3, 3, 'Welcome bonus — 3 free credits', 'completed');

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_on_new_user();

-- =====================================================================
-- HELPER FUNCTION: does user have an active subscription?
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_user_has_sub(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.subscriptions
        WHERE user_id = p_user_id
          AND status = 'active'
          AND current_period_end > NOW()
    );
END;
$$;

-- =====================================================================
-- HELPER FUNCTION: can user access a specific episode?
-- Used by RLS policies on panels table
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_can_access_episode(p_user_id UUID, p_episode_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT access_tier INTO v_tier
    FROM public.episodes
    WHERE id = p_episode_id AND is_published = TRUE;

    IF NOT FOUND THEN RETURN FALSE; END IF;

    -- Free and ad-supported tiers: always accessible
    IF v_tier IN ('free', 'ad_supported') THEN RETURN TRUE; END IF;

    -- Active subscription unlocks everything
    IF public.fn_user_has_sub(p_user_id) THEN RETURN TRUE; END IF;

    -- Check explicit access grant (purchase or credit unlock)
    RETURN EXISTS (
        SELECT 1 FROM public.user_episode_access
        WHERE user_id = p_user_id
          AND episode_id = p_episode_id
          AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$;

-- =====================================================================
-- HELPER FUNCTION: increment XP and auto-level
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_add_xp(p_user_id UUID, p_xp INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_new_xp    INTEGER;
    v_new_level INTEGER;
BEGIN
    UPDATE public.profiles
    SET xp_points = xp_points + p_xp
    WHERE id = p_user_id
    RETURNING xp_points INTO v_new_xp;

    -- Level = floor(xp / 200) + 1
    v_new_level := FLOOR(v_new_xp / 200) + 1;

    UPDATE public.profiles
    SET level = v_new_level
    WHERE id = p_user_id AND level != v_new_level;
END;
$$;

-- =====================================================================
-- HELPER FUNCTION: rate limit check
-- Returns TRUE if under limit, FALSE if over limit
-- =====================================================================
CREATE OR REPLACE FUNCTION public.fn_check_rate_limit(
    p_user_id UUID,
    p_action  TEXT,
    p_limit   INTEGER DEFAULT 60   -- max calls per hour
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_window TIMESTAMPTZ := date_trunc('hour', NOW());
    v_count  INTEGER;
BEGIN
    INSERT INTO public.rate_limits (user_id, action, window_start, call_count)
    VALUES (p_user_id, p_action, v_window, 1)
    ON CONFLICT (user_id, action, window_start)
    DO UPDATE SET call_count = rate_limits.call_count + 1
    RETURNING call_count INTO v_count;

    IF v_count > p_limit THEN
        INSERT INTO public.error_logs
            (user_id, error_type, error_message, severity)
        VALUES
            (p_user_id, 'rate_limit',
             'Rate limit exceeded: ' || p_action || ' (' || v_count || '/' || p_limit || ')',
             'warning');
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- =====================================================================
-- ROW LEVEL SECURITY — enable on every table, no exceptions
-- =====================================================================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_views            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_episode_access ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────
CREATE POLICY "profiles: user reads own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles: user updates own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "profiles: admin reads all"
    ON public.profiles FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── comics ────────────────────────────────────────────────────────────
CREATE POLICY "comics: public reads published"
    ON public.comics FOR SELECT
    USING (is_published = TRUE OR auth.uid() IS NOT NULL);

CREATE POLICY "comics: admin full access"
    ON public.comics FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── episodes ──────────────────────────────────────────────────────────
CREATE POLICY "episodes: public reads published metadata"
    ON public.episodes FOR SELECT
    USING (is_published = TRUE);

CREATE POLICY "episodes: admin full access"
    ON public.episodes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── panels (most restrictive — content behind paywall) ───────────────
CREATE POLICY "panels: user accesses if episode accessible"
    ON public.panels FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND
        public.fn_can_access_episode(auth.uid(), episode_id)
    );

CREATE POLICY "panels: admin full access"
    ON public.panels FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── subscriptions ─────────────────────────────────────────────────────
CREATE POLICY "subs: user reads own"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "subs: admin reads all"
    ON public.subscriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── purchases ─────────────────────────────────────────────────────────
CREATE POLICY "purchases: user reads own"
    ON public.purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "purchases: admin reads all"
    ON public.purchases FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── credits ───────────────────────────────────────────────────────────
CREATE POLICY "credits: user reads own"
    ON public.credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "credits: admin reads all"
    ON public.credits FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── transactions ──────────────────────────────────────────────────────
CREATE POLICY "txns: user reads own"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "txns: admin reads all"
    ON public.transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── ad_views ──────────────────────────────────────────────────────────
CREATE POLICY "ad_views: user inserts own"
    ON public.ad_views FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ad_views: user reads own"
    ON public.ad_views FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "ad_views: admin reads all"
    ON public.ad_views FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── error_logs ────────────────────────────────────────────────────────
CREATE POLICY "error_logs: anyone can insert"
    ON public.error_logs FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "error_logs: admin reads all"
    ON public.error_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- ── rate_limits ───────────────────────────────────────────────────────
CREATE POLICY "rate_limits: user reads own"
    ON public.rate_limits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "rate_limits: service can insert"
    ON public.rate_limits FOR INSERT
    WITH CHECK (TRUE);

-- ── user_episode_access ───────────────────────────────────────────────
CREATE POLICY "access: user reads own"
    ON public.user_episode_access FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "access: admin full"
    ON public.user_episode_access FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.is_admin = TRUE
    ));

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('comic-panels',  'comic-panels',  FALSE, 5242880,
     ARRAY['image/jpeg','image/png','image/webp']),
    ('comic-covers',  'comic-covers',  TRUE,  2097152,
     ARRAY['image/jpeg','image/png','image/webp']),
    ('avatars',       'avatars',       TRUE,  1048576,
     ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: private comic-panels — only authenticated with access
CREATE POLICY "panels-storage: auth user reads"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'comic-panels' AND auth.role() = 'authenticated');

CREATE POLICY "panels-storage: admin uploads"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'comic-panels' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

CREATE POLICY "panels-storage: admin deletes"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'comic-panels' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
    );

-- Storage RLS: public buckets (covers + avatars)
CREATE POLICY "public-storage: anyone reads covers and avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('comic-covers', 'avatars'));

CREATE POLICY "avatars-storage: user uploads own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================================
-- SEED DATA: 8 comics from maze-man-v7
-- =====================================================================
INSERT INTO public.comics
    (slug, title, title_ar, description, category, is_published, is_featured, sort_order)
VALUES
    ('the-conformity-trap',  'The Conformity Trap',  'فخ المطابقة',
     'How group pressure rewires our perception of truth. Solomon Asch changed psychology forever.',
     'social',    TRUE, TRUE,  1),
    ('mirror-neurons',       'Mirror Neurons',        'الخلايا العصبية المرآتية',
     'The neural basis of empathy — your brain literally simulates others'' feelings.',
     'neuro',     TRUE, FALSE, 2),
    ('the-maze-within',      'The Maze Within',       'المتاهة الداخلية',
     'The mind is not a container. It is a process constantly constructing reality.',
     'cognitive', TRUE, FALSE, 3),
    ('group-dynamics',       'Group Dynamics',        'ديناميكيات المجموعة',
     'Roles, polarization, groupthink — how groups amplify extremes.',
     'social',    TRUE, FALSE, 4),
    ('memory-palace',        'Memory Palace',         'قصر الذاكرة',
     'The ancient technique world memory champions use to memorize thousands of facts.',
     'cognitive', TRUE, FALSE, 5),
    ('the-shadow-self',      'The Shadow Self',       'الذات الظلية',
     'Jung''s unconscious repository of everything we deny about ourselves.',
     'depth',     TRUE, FALSE, 6),
    ('cognitive-biases',     'Cognitive Biases',      'التحيزات المعرفية',
     '180+ ways the human brain distorts reality — and how to fight back.',
     'cognitive', TRUE, FALSE, 7),
    ('the-social-network',   'The Social Network',    'الشبكة الاجتماعية',
     'Dunbar''s number, the loneliness epidemic, and what real connection means.',
     'social',    TRUE, FALSE, 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- VERIFICATION QUERIES — run after migration to confirm success
-- =====================================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT polname, tablename FROM pg_policies JOIN pg_class ON pg_class.oid = pg_policies.polrelid WHERE pg_class.relnamespace = 'public'::regnamespace ORDER BY tablename;
-- SELECT * FROM public.comics;
