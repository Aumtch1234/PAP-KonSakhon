--
-- PostgreSQL database dump
--

\restrict XqJC5FI7WV9Nh7xeeimkV6kB8ubRJwufF2HIJEPeMQIKfYyHV6vytK2E6FozuVz

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

-- Started on 2025-10-20 04:42:09 +07

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 231 (class 1255 OID 34307)
-- Name: update_chat_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_chat_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE chats 
    SET updated_at = NOW() 
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_chat_timestamp() OWNER TO postgres;

--
-- TOC entry 233 (class 1255 OID 34480)
-- Name: update_friend_requests_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_friend_requests_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_friend_requests_timestamp() OWNER TO postgres;

--
-- TOC entry 232 (class 1255 OID 34308)
-- Name: update_last_message(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_last_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE chats 
    SET last_message = NEW.message
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_last_message() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 34309)
-- Name: chats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    user1_id integer NOT NULL,
    user2_id integer NOT NULL,
    last_message text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT check_different_users CHECK ((user1_id < user2_id))
);


ALTER TABLE public.chats OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 34317)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    chat_id integer NOT NULL,
    sender_id integer NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 34324)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    profile_image character varying(255) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    email_verified boolean DEFAULT false,
    status character varying(20) DEFAULT 'active'::character varying,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text, ('suspended'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 34335)
-- Name: chat_list_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.chat_list_view AS
 SELECT c.id,
    c.user1_id,
    c.user2_id,
    c.last_message,
    c.created_at,
    c.updated_at,
    u1.name AS user1_name,
    u1.email AS user1_email,
    u1.profile_image AS user1_profile_image,
    u2.name AS user2_name,
    u2.email AS user2_email,
    u2.profile_image AS user2_profile_image,
    ( SELECT count(*) AS count
           FROM public.messages m
          WHERE ((m.chat_id = c.id) AND (m.sender_id = c.user2_id) AND (m.is_read = false))) AS user1_unread_count,
    ( SELECT count(*) AS count
           FROM public.messages m
          WHERE ((m.chat_id = c.id) AND (m.sender_id = c.user1_id) AND (m.is_read = false))) AS user2_unread_count
   FROM ((public.chats c
     JOIN public.users u1 ON ((c.user1_id = u1.id)))
     JOIN public.users u2 ON ((c.user2_id = u2.id)));


ALTER VIEW public.chat_list_view OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 34340)
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chats_id_seq OWNER TO postgres;

--
-- TOC entry 3539 (class 0 OID 0)
-- Dependencies: 219
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- TOC entry 229 (class 1259 OID 34454)
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.friend_requests (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    recipient_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT friend_requests_check CHECK ((sender_id <> recipient_id)),
    CONSTRAINT friend_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.friend_requests OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 34482)
-- Name: friend_list; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.friend_list AS
 SELECT
        CASE
            WHEN (fr.sender_id = u.id) THEN fr.recipient_id
            ELSE fr.sender_id
        END AS friend_id,
    u.id AS user_id,
        CASE
            WHEN (fr.sender_id = u.id) THEN u2.name
            ELSE u1.name
        END AS friend_name,
        CASE
            WHEN (fr.sender_id = u.id) THEN u2.profile_image
            ELSE u1.profile_image
        END AS friend_profile_image,
        CASE
            WHEN (fr.sender_id = u.id) THEN u2.email
            ELSE u1.email
        END AS friend_email,
    fr.created_at,
    fr.status
   FROM (((public.friend_requests fr
     JOIN public.users u ON (((fr.sender_id = u.id) OR (fr.recipient_id = u.id))))
     LEFT JOIN public.users u1 ON ((fr.sender_id = u1.id)))
     LEFT JOIN public.users u2 ON ((fr.recipient_id = u2.id)))
  WHERE ((fr.status)::text = 'accepted'::text);


ALTER VIEW public.friend_list OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 34453)
-- Name: friend_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.friend_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.friend_requests_id_seq OWNER TO postgres;

--
-- TOC entry 3540 (class 0 OID 0)
-- Dependencies: 228
-- Name: friend_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.friend_requests_id_seq OWNED BY public.friend_requests.id;


--
-- TOC entry 220 (class 1259 OID 34341)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- TOC entry 3541 (class 0 OID 0)
-- Dependencies: 220
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- TOC entry 221 (class 1259 OID 34342)
-- Name: post_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url character varying(500) DEFAULT NULL::character varying
);


ALTER TABLE public.post_comments OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 34350)
-- Name: post_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_comments_id_seq OWNER TO postgres;

--
-- TOC entry 3542 (class 0 OID 0)
-- Dependencies: 222
-- Name: post_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_comments_id_seq OWNED BY public.post_comments.id;


--
-- TOC entry 223 (class 1259 OID 34351)
-- Name: post_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.post_likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.post_likes OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 34355)
-- Name: post_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.post_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.post_likes_id_seq OWNER TO postgres;

--
-- TOC entry 3543 (class 0 OID 0)
-- Dependencies: 224
-- Name: post_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.post_likes_id_seq OWNED BY public.post_likes.id;


--
-- TOC entry 225 (class 1259 OID 34356)
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL,
    image_url character varying(500) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 34364)
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO postgres;

--
-- TOC entry 3544 (class 0 OID 0)
-- Dependencies: 226
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- TOC entry 227 (class 1259 OID 34365)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 3545 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3290 (class 2604 OID 34366)
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- TOC entry 3312 (class 2604 OID 34457)
-- Name: friend_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests ALTER COLUMN id SET DEFAULT nextval('public.friend_requests_id_seq'::regclass);


--
-- TOC entry 3293 (class 2604 OID 34367)
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- TOC entry 3302 (class 2604 OID 34368)
-- Name: post_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments ALTER COLUMN id SET DEFAULT nextval('public.post_comments_id_seq'::regclass);


--
-- TOC entry 3306 (class 2604 OID 34369)
-- Name: post_likes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes ALTER COLUMN id SET DEFAULT nextval('public.post_likes_id_seq'::regclass);


--
-- TOC entry 3308 (class 2604 OID 34370)
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- TOC entry 3296 (class 2604 OID 34371)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3520 (class 0 OID 34309)
-- Dependencies: 215
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chats (id, user1_id, user2_id, last_message, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3533 (class 0 OID 34454)
-- Dependencies: 229
-- Data for Name: friend_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.friend_requests (id, sender_id, recipient_id, status, created_at, updated_at) FROM stdin;
4	5	6	pending	2025-10-20 02:17:01.564261	2025-10-20 02:17:01.564261
5	5	8	accepted	2025-10-20 02:18:30.048069	2025-10-20 02:28:10.035894
6	5	4	pending	2025-10-20 03:52:16.724157	2025-10-20 03:52:16.724157
\.


--
-- TOC entry 3521 (class 0 OID 34317)
-- Dependencies: 216
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, chat_id, sender_id, message, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 3525 (class 0 OID 34342)
-- Dependencies: 221
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_comments (id, user_id, post_id, content, created_at, updated_at, image_url) FROM stdin;
4	4	9	ขอให้เป็นวันที่ดีนะจ้ะ	2025-09-21 17:38:05	2025-09-21 17:38:05	\N
5	5	9	เหมือนกันนะจ้ะ ตะเอง	2025-09-21 17:42:41	2025-09-21 17:42:41	\N
6	5	12	ตลกจังเลย555 🤣	2025-09-21 18:12:38	2025-09-21 18:12:38	\N
\.


--
-- TOC entry 3527 (class 0 OID 34351)
-- Dependencies: 223
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.post_likes (id, user_id, post_id, created_at) FROM stdin;
4	4	9	2025-09-21 17:37:39
5	5	9	2025-09-21 17:42:17
6	5	12	2025-09-21 18:12:20
8	8	13	2025-10-13 00:02:24.22387
9	8	12	2025-10-16 11:21:18.398433
10	5	11	2025-10-16 11:22:26.607244
11	5	13	2025-10-20 01:09:46.47936
12	5	10	2025-10-20 01:52:46.362439
13	9	13	2025-10-20 04:01:05.564257
\.


--
-- TOC entry 3529 (class 0 OID 34356)
-- Dependencies: 225
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.posts (id, user_id, content, image_url, created_at, updated_at) FROM stdin;
9	4	สวัสดี ทุกคน กับเช้าที่ สดใส !!	/uploads/1758474326430-tjr9djtld0r.jpg	2025-09-21 17:05:26	2025-09-21 17:05:26
10	6	สวัสดี วันจันทร์ครับทุกคนที่น่ารัก 🥰	/uploads/1758477486106-l9cis7gcwvm.jpg	2025-09-21 17:58:06	2025-09-21 17:58:06
11	6	POV:	/uploads/1758477880711-jgoaor1il9s.jpg	2025-09-21 18:04:40	2025-09-21 18:04:40
12	5	POV : เมื่อคุณเบื่อ ข้างบ้าน	/uploads/1758478002730-wy9im861s9.jpeg	2025-09-21 18:06:42	2025-09-21 18:06:42
13	5	เมื่อเราไม่ไหว 😵‍💫\rแต่ใจสั่งมา 🤯	/uploads/1758478152587-mfrvvosrjo.jpg	2025-09-21 18:09:12	2025-09-21 18:09:12
\.


--
-- TOC entry 3522 (class 0 OID 34324)
-- Dependencies: 217
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, profile_image, created_at, updated_at, last_login, email_verified, status) FROM stdin;
4	นาย เปา	zoro@gmail.com	$2a$12$rMYgjqJblUFcXaUe4Sx/ZujftXaUrxI4mFSgrY7638F9YvseIZzdC	/uploads/profiles/profile_1758474250472.jpeg	2025-09-21 17:04:11	2025-09-21 17:28:33	2025-09-21 17:28:33	f	active
6	แรมซี่ ขยี้ใจ	test1@gmail.com	$2a$12$w1yD2SN0BgDNRTNbOIoLIe/DVM1oTafUJI8WZZZBENq7fgQi7UZ02	/uploads/profiles/profile_6_1758476872268.jpg	2025-09-21 17:46:11	2025-09-21 17:48:59	2025-09-21 17:48:59	f	active
8	GU	a@gmail.com	$2a$12$wgjfSPr8CHD5HSrtzNjON.A.cFBu1y3I8HChH1Whu4HzwFMgWZzC2	/uploads/profiles/profile_1760305374438.jpeg	2025-10-13 04:42:54.819388	2025-10-13 04:42:54.819388	2025-10-20 02:19:49.151353	f	active
5	KhonThai	test@gmail.com	$2a$12$T9yYLvRHFRChtxb7LVlOqOzLj2tuZtzi9SuwtB9eYoEa5COx12jVW	/uploads/profiles/profile_5_1760901576679.png	2025-09-21 17:42:00	2025-10-20 02:19:36.689938	2025-10-20 03:54:47.383517	f	active
9	UD OIO	zoro1@gmail.com	$2a$12$bvh8Pe5QzXOqajBkr0KoH.FXP316MBK8gx/SEtU/P6yLrbNdzFLkS	/uploads/profiles/profile_1760907233885.jpg	2025-10-20 03:53:54.317362	2025-10-20 03:53:54.317362	2025-10-20 04:00:50.761632	f	active
\.


--
-- TOC entry 3546 (class 0 OID 0)
-- Dependencies: 219
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chats_id_seq', 8, true);


--
-- TOC entry 3547 (class 0 OID 0)
-- Dependencies: 228
-- Name: friend_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.friend_requests_id_seq', 8, true);


--
-- TOC entry 3548 (class 0 OID 0)
-- Dependencies: 220
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 88, true);


--
-- TOC entry 3549 (class 0 OID 0)
-- Dependencies: 222
-- Name: post_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_comments_id_seq', 10, true);


--
-- TOC entry 3550 (class 0 OID 0)
-- Dependencies: 224
-- Name: post_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.post_likes_id_seq', 13, true);


--
-- TOC entry 3551 (class 0 OID 0)
-- Dependencies: 226
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.posts_id_seq', 14, true);


--
-- TOC entry 3552 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 9, true);


--
-- TOC entry 3321 (class 2606 OID 34373)
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- TOC entry 3355 (class 2606 OID 34464)
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 3357 (class 2606 OID 34466)
-- Name: friend_requests friend_requests_sender_id_recipient_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_recipient_id_key UNIQUE (sender_id, recipient_id);


--
-- TOC entry 3333 (class 2606 OID 34375)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3343 (class 2606 OID 34377)
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3347 (class 2606 OID 34379)
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 3349 (class 2606 OID 34381)
-- Name: post_likes post_likes_user_id_post_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_post_id_key UNIQUE (user_id, post_id);


--
-- TOC entry 3353 (class 2606 OID 34383)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 3327 (class 2606 OID 34385)
-- Name: chats unique_chat_users; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT unique_chat_users UNIQUE (user1_id, user2_id);


--
-- TOC entry 3337 (class 2606 OID 34387)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3339 (class 2606 OID 34389)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3322 (class 1259 OID 34390)
-- Name: idx_chats_both_users; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_both_users ON public.chats USING btree (user1_id, user2_id);


--
-- TOC entry 3323 (class 1259 OID 34391)
-- Name: idx_chats_updated; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_updated ON public.chats USING btree (updated_at DESC);


--
-- TOC entry 3324 (class 1259 OID 34392)
-- Name: idx_chats_user1; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_user1 ON public.chats USING btree (user1_id);


--
-- TOC entry 3325 (class 1259 OID 34393)
-- Name: idx_chats_user2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chats_user2 ON public.chats USING btree (user2_id);


--
-- TOC entry 3358 (class 1259 OID 34479)
-- Name: idx_friendship; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_friendship ON public.friend_requests USING btree (sender_id, recipient_id);


--
-- TOC entry 3328 (class 1259 OID 34394)
-- Name: idx_messages_chat_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_chat_created ON public.messages USING btree (chat_id, created_at DESC);


--
-- TOC entry 3329 (class 1259 OID 34395)
-- Name: idx_messages_chat_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_chat_unread ON public.messages USING btree (chat_id, is_read) WHERE (is_read = false);


--
-- TOC entry 3330 (class 1259 OID 34396)
-- Name: idx_messages_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created ON public.messages USING btree (created_at DESC);


--
-- TOC entry 3331 (class 1259 OID 34397)
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- TOC entry 3340 (class 1259 OID 34398)
-- Name: idx_post_comments_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_comments_post_id ON public.post_comments USING btree (post_id);


--
-- TOC entry 3341 (class 1259 OID 34399)
-- Name: idx_post_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_comments_user_id ON public.post_comments USING btree (user_id);


--
-- TOC entry 3344 (class 1259 OID 34400)
-- Name: idx_post_likes_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_likes_post_id ON public.post_likes USING btree (post_id);


--
-- TOC entry 3345 (class 1259 OID 34401)
-- Name: idx_post_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_post_likes_user_id ON public.post_likes USING btree (user_id);


--
-- TOC entry 3350 (class 1259 OID 34402)
-- Name: idx_posts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at);


--
-- TOC entry 3351 (class 1259 OID 34403)
-- Name: idx_posts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);


--
-- TOC entry 3359 (class 1259 OID 34478)
-- Name: idx_recipient_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recipient_status ON public.friend_requests USING btree (recipient_id, status);


--
-- TOC entry 3360 (class 1259 OID 34477)
-- Name: idx_sender_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sender_status ON public.friend_requests USING btree (sender_id, status);


--
-- TOC entry 3334 (class 1259 OID 34404)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 3335 (class 1259 OID 34405)
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- TOC entry 3372 (class 2620 OID 34406)
-- Name: messages trigger_update_chat_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_chat_timestamp AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_chat_timestamp();


--
-- TOC entry 3374 (class 2620 OID 34481)
-- Name: friend_requests trigger_update_friend_requests_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_friend_requests_timestamp BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_friend_requests_timestamp();


--
-- TOC entry 3373 (class 2620 OID 34407)
-- Name: messages trigger_update_last_message; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_last_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_last_message();


--
-- TOC entry 3361 (class 2606 OID 34408)
-- Name: chats chats_user1_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user1_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3362 (class 2606 OID 34413)
-- Name: chats chats_user2_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user2_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3370 (class 2606 OID 34472)
-- Name: friend_requests friend_requests_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3371 (class 2606 OID 34467)
-- Name: friend_requests friend_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3363 (class 2606 OID 34418)
-- Name: messages messages_chat_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- TOC entry 3364 (class 2606 OID 34423)
-- Name: messages messages_sender_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3365 (class 2606 OID 34428)
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- TOC entry 3366 (class 2606 OID 34433)
-- Name: post_comments post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3367 (class 2606 OID 34438)
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- TOC entry 3368 (class 2606 OID 34443)
-- Name: post_likes post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3369 (class 2606 OID 34448)
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-10-20 04:42:09 +07

--
-- PostgreSQL database dump complete
--

\unrestrict XqJC5FI7WV9Nh7xeeimkV6kB8ubRJwufF2HIJEPeMQIKfYyHV6vytK2E6FozuVz

