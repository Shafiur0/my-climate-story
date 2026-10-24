/* ═══════════════════════════════════════════════════════════════
   app.js — My Climate Story
   Delta Detectives · NASA Space Apps Challenge 2026
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const D = window.NASA_DATA;
  const SITES = D.sites;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════════════
     SUBMISSION CONFIG — fill these in before you submit.
     Space Apps judges score "Repository access" and the project page
     directly, so an empty repo here costs points.
     ══════════════════════════════════════════════════════════════ */
  const CONFIG = {
    // Public GitHub URL. Must open without a login — test it in a private window.
    repo: '',

    // The 30-second final video, on YouTube or Vimeo (unlisted is fine).
    video: '',

    // Every team member, with the role they played.
    team: [
      // { name: 'Full Name', role: 'Frontend & data visualisation' },
    ],

    // Backend base URL. Leave empty to call NASA directly from the browser,
    // which is what ships today. Set it (e.g. 'https://api.example.org') to
    // route every time-series request through the team backend instead.
    // See docs/API.md for the contract this must satisfy.
    apiBase: ''
  };

  // Read by js/power.js at request time.
  window.MC_CONFIG = { apiBase: CONFIG.apiBase };

  const CHALLENGE_URL = 'https://www.spaceappschallenge.org/2026/challenges/be-an-earth-system-trend-detective/';

  function median(a) {
    const s = a.slice().sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ═══════════════════════ i18n ═══════════════════════ */
  const I18N = {
    en: {},
    bn: {
      'nav.explore': 'এক্সপ্লোর', 'nav.trend': 'ট্রেন্ড ল্যাব', 'nav.quiz': 'কুইজ',
      'nav.act': 'পদক্ষেপ', 'nav.teach': 'শিক্ষক', 'nav.method': 'পদ্ধতি', 'nav.start': 'শুরু',

      'hero.eyebrow': 'নাসা স্পেস অ্যাপস ২০২৬ · দ্য নেক্সট ফ্রন্টিয়ার',
      'hero.challenge': 'চ্যালেঞ্জ · বি অ্যান আর্থ সিস্টেম ট্রেন্ড ডিটেকটিভ',
      'hero.event': 'বাংলাদেশ লোকাল ইভেন্ট · ১৩–১৪ নভেম্বর ২০২৬',
      'hero.h1a': 'আপনার নিজের এলাকারও আছে একটি',
      'hero.h1b': 'জলবায়ু গল্প।',
      'hero.lede': 'একটি জায়গা বেছে নিন। চার দশকের নাসা স্যাটেলাইট তথ্য দেখাবে সেখানে আসলে কী বদলেছে — নদী, গরম, বৃষ্টি — সহজ ভাষায়, আর এমন প্রমাণসহ যা আপনি নিজেই যাচাই করতে পারবেন।',
      'hero.cta1': 'আপনার এলাকা দেখুন',
      'hero.cta2': '৬০ সেকেন্ডের কুইজ',
      'hero.s1l': 'নাসা তথ্যের সময়সীমা', 'hero.s2l': 'পাইলট এলাকা',
      'hero.s3l': 'বৈশ্বিক ২০২৪ বিচ্যুতি', 'hero.s4l': 'ট্রেন্ড পরীক্ষা',

      'problem.eyebrow': 'সমস্যা',
      'problem.h2': 'জলবায়ু পরিবর্তন শেখানো হয় একটি গ্রহ হিসেবে।<br>মানুষ বাস করে একটি <em>জায়গায়</em>।',
      'problem.p1': 'বৈশ্বিক গড় সত্য — এবং সাতক্ষীরার একটি ক্লাসরুমে প্রায় অকেজো। সেখানকার একজন শিক্ষার্থী ১.২৮ °C অনুভব করে না। সে অনুভব করে আরও গরম একটি সেপ্টেম্বর, দুইশো মিটার সরে যাওয়া একটি নদী, দেরিতে আসা বর্ষা।',
      'problem.p2': 'বেশিরভাগ জলবায়ু টুল ইংরেজি-প্রধান, তথ্যভারী, আর ধরে নেয় দ্রুত ইন্টারনেট ও কারিগরি জ্ঞান আছে। যারা সবচেয়ে দীর্ঘদিন পরিণতি ভোগ করবে, তাদের হাতেই সবচেয়ে কম হাতিয়ার আছে।',
      'problem.callout': 'তাই আমরা উল্টোটা বানিয়েছি: স্থানীয়, সহজ ভাষার, কম-ব্যান্ডউইথের একটি অ্যাপ যেখানে প্রতিটি দাবি নাসার কোনো ডেটাসেট পর্যন্ত ফিরে যায় — এবং যেখানে অ্যাপটি বলতে পারে <strong>“এখনও জানি না।”</strong>',

      'how.eyebrow': 'কীভাবে কাজ করে',
      'how.h2': 'ম্যাপের একটি পিন থেকে এমন একটি গল্প পর্যন্ত পাঁচ ধাপ, যা নিয়ে আপনি তর্ক করতে পারবেন।',
      'how.s1t': 'আপনার জায়গা বেছে নিন',
      'how.s1p': 'গ্রাম, শহর বা জেলা খুঁজুন — বা পৃথিবীর যেকোনো জায়গায় পিন ফেলুন। আপনার কোঅর্ডিনেট প্রতিটি কার্ডে দেখা যাবে।',
      'how.s2t': 'পরিবর্তন দেখুন',
      'how.s2p': 'আগে-পরে স্লাইডার একই জমির স্যাটেলাইট ছবি মেলায় — একই ঋতুতে, বছরের ব্যবধানে।',
      'how.s3t': 'প্রবণতা বুঝুন',
      'how.s3p': 'থাইল–সেন ঢাল ও ৯৫% আস্থার ব্যবধান দেখায় সেপ্টেম্বর কত দ্রুত উষ্ণ হচ্ছে — এবং সংকেতটি সত্যিই আছে কি না।',
      'how.s4t': 'খেলে শিখুন',
      'how.s4p': 'কোন ছবিটি ২০০০ সালের — অনুমান করুন। কোন মাসে সবচেয়ে বেশি গরম বেড়েছে — খুঁজুন। এমন শেখা যা মনে থাকে।',
      'how.s5t': 'পদক্ষেপ নিন',
      'how.s5p': 'শিক্ষার্থী, স্কুল ও পরিবারের জন্য বাস্তব, স্থানীয় পদক্ষেপ — একজন মানুষ আসলে যা করতে পারে।',

      'peek.eyebrow': 'সরাসরি নাসা ইমেজারি',
      'peek.h2': 'হ্যান্ডেলটি টানুন। দেখুন ডেল্টা কতটা সরে গেছে।',
      'peek.sub': 'মেঘনা মোহনা, ভোলা। একই নভেম্বর সপ্তাহ, চব্বিশ বছর ব্যবধানে — সরাসরি নাসা GIBS থেকে।',
      'peek.cta': 'পূর্ণ এক্সপ্লোরার খুলুন',

      'data.eyebrow': 'ভেতরের তথ্য',
      'data.h2': 'চারটি উন্মুক্ত নাসা প্রোডাক্ট। কোনো মালিকানা নেই, কিছুই লুকানো নেই।',
      'data.d1': 'ঐতিহাসিক ট্রু-কালার ও ফলস-কালার স্যাটেলাইট ছবি, ম্যাপ টাইল হিসেবে। কোনো কী বা লগইন লাগে না।',
      'data.d2': '১৯৮১ থেকে আজ পর্যন্ত নির্দিষ্ট স্থানের তাপমাত্রা ও বৃষ্টিপাত — শুধু অক্ষাংশ-দ্রাঘিমাংশ দিলেই।',
      'data.d3': 'বৈশ্বিক ভূমি-মহাসাগর তাপমাত্রার বিচ্যুতি, যাতে স্থানীয় গল্পকে সৎভাবে বৈশ্বিক প্রেক্ষাপটে রাখা যায়।',
      'data.d4': 'চল্লিশ বছরের ৩০ মিটার পৃষ্ঠ-পরিবর্তন, সাথে রাডার-ভিত্তিক বন্যার জলমানচিত্র।',

      'why.eyebrow': 'কেন এটি আলাদা',
      'why.h2': 'বেশিরভাগ অ্যাপ একটি সংখ্যা দেখায়। এটি দেখায় রসিদ।',
      'why.w1t': 'স্থানীয়, বৈশ্বিক নয়',
      'why.w1p': 'আপনার কোঅর্ডিনেট, আপনার গ্রিড সেল, আপনার সেপ্টেম্বর। বৈশ্বিক গড় কখনো কাউকে বলে নি তার নিজের মাঠে কী হয়েছে।',
      'why.w2t': 'যাচাইযোগ্য প্রমাণ',
      'why.w2p': 'প্রতিটি সংখ্যা একটি এভিডেন্স পাসপোর্ট খোলে: উৎস, সময়কাল, নমুনা, পদ্ধতি, অনিশ্চয়তা ও সতর্কতা।',
      'why.w3t': 'অনিশ্চয়তা নিয়ে সৎ',
      'why.w3p': 'তথ্য যখন দাবি সমর্থন করতে পারে না, অ্যাপ বলে “এখনও নির্ভরযোগ্য সিদ্ধান্ত নেই।” এটাই এর শক্তি।',
      'why.w4t': 'দুর্বল নেটওয়ার্কের জন্য',
      'why.w4p': 'স্ট্যাটিক ডেটা কার্ড, সংকুচিত ছবি, লাইট মোড। কোনো ৩ডি গ্লোব ডাউনলোড নয়। ধীর ফোনেও খোলে।',

      'cta.eyebrow': 'একটি জায়গা দিয়ে শুরু করুন',
      'cta.h2': 'আপনার নিজের কোঅর্ডিনেট বেছে নিন।<br>গল্পটি আগেই আর্কাইভে আছে।',
      'cta.p': 'চারটি পাইলট এলাকায় আজ সম্পূর্ণ নাসা কভারেজ আছে। একই পদ্ধতি পৃথিবীর যেকোনো জায়গায় কাজ করে, যেখানে স্যাটেলাইট দেখতে পায়।',
      'cta.b1': 'আপনার এলাকা দেখুন', 'cta.b2': 'পদ্ধতি পড়ুন',

      'ex.eyebrow': 'অবস্থান', 'ex.h2': 'একটি জায়গা বেছে নিন',
      'ex.p': 'পাইলট এলাকায় সম্পূর্ণ যাচাইকৃত নাসা কভারেজ আছে। যেকোনো জায়গায় পিনও ফেলতে পারেন।',
      'ex.coords': 'অথবা কোঅর্ডিনেট দিন', 'ex.imagery': 'ইমেজারি লেয়ার',
      'ex.true': 'ট্রু কালার', 'ex.false': 'ফলস কালার',
      'ex.note': 'ফলস কালার (ব্যান্ড ৭-২-১) জল ও উদ্ভিদকে স্পষ্ট আলাদা করে — নদীর গতিপথ ধরার সময় বিশ্লেষকরা এটাই ব্যবহার করেন।',
      'ex.live': 'সরাসরি নাসা ফিড', 'ex.septTrend': 'সেপ্টেম্বর প্রবণতা',
      'ex.reset': 'রিসেট', 'ex.expand': 'বড় করুন',
      'ex.caption': 'বছরের একই সপ্তাহ, মেঘ বাদ দেওয়া। ঋতু মেলানো জরুরি: বর্ষার মাসকে শুষ্ক মাসের সাথে মেলালে পার্থক্যটা আবহাওয়ার, জলবায়ুর নয়।',
      'ex.tempTitle': 'সেপ্টেম্বরের তাপমাত্রা', 'ex.rainTitle': 'বার্ষিক বৃষ্টিপাত',
      'ex.obs': 'পর্যবেক্ষণ', 'ex.trend': 'থাইল–সেন প্রবণতা', 'ex.band': '৯৫% ব্যবধান',
      'ex.rainWarn': 'এখানকার ধাপ-পরিবর্তন একটি ডেটা-মানের সূত্র, জলবায়ু সিদ্ধান্ত নয়। পদ্ধতি পৃষ্ঠা দেখুন।',
      'ex.meaningEyebrow': 'সহজ ভাষায়', 'ex.decade': '°C প্রতি দশকে',
      'ex.globalTitle': 'বৈশ্বিক প্রেক্ষাপট', 'ex.globalSub': 'নাসা GISTEMP v4 · ১৯৫১–১৯৮০ সাপেক্ষে বিচ্যুতি',
      'ex.globalNote': 'এটি প্রেক্ষাপট, বিয়োগ করার সংখ্যা নয়। GISTEMP-এর ভিত্তি ও স্থানিক স্কেল আপনার কোঅর্ডিনেটের পরম POWER তাপমাত্রার চেয়ে আলাদা।',

      'pp.title': 'এভিডেন্স পাসপোর্ট', 'pp.sub': 'এই গল্পের প্রতিটি দাবির নিজস্ব কাগজপত্র আছে।',
      'pp.status': 'মান-যাচাই উত্তীর্ণ', 'pp.caveatLabel': 'সতর্কতা',

      'tl.eyebrow': 'ট্রেন্ড ল্যাব',
      'tl.h1': 'বারো মাস। চার জায়গা। কোনটি আসলে বদলাচ্ছে?',
      'tl.lede': 'বার্ষিক গড় গল্পটি লুকিয়ে রাখে। এই গ্রিড প্রতিটি এলাকার প্রতিটি ক্যালেন্ডার মাসের জন্য আলাদা থাইল–সেন প্রবণতা চালায়, তারপর ৪৮টি p-মান একসাথে বেনজামিনি–হোকবার্গ পদ্ধতিতে সংশোধন করে। যেকোনো ঘরে হোভার করুন।',
      'tl.p1': '১৯৮৫ – ২০২৪', 'tl.p2': '২০০১ – ২০২৪',
      'tl.hover': 'পরীক্ষাটি দেখতে একটি ঘরে হোভার করুন।',
      'tl.n1t': 'কেন সেপ্টেম্বর', 'tl.n1p': '২০০১–২০২৪ সময়ে সেপ্টেম্বরই একমাত্র মাস যা চারটি এলাকাতেই উল্লেখযোগ্যভাবে উষ্ণ হয়েছে। এটি খোঁজার মতো সূত্র, সিদ্ধান্ত নয়।',
      'tl.n2t': 'কেন ৪৮টি পরীক্ষা সংশোধন', 'tl.n2p': 'যথেষ্ট পরীক্ষা চালালে ভাগ্যক্রমে কিছু একটা তাৎপর্যপূর্ণ দেখাবে। q-মান জিজ্ঞেস করে: ৪৮টি চেষ্টার হিসাব রাখার পরেও এটি কি এখনও অবাক করার মতো?',
      'tl.n3t': 'কেন ৪০ বছরের ছবি মেলে না', 'tl.n3p': '১৯৮৫–২০২৪ সময়ে কয়েকটি মাসে আপাত শীতলতা দেখা যায়। এটি রিঅ্যানালাইসিস আর্টিফ্যাক্টের সংকেত, ঠান্ডা বাংলাদেশের প্রমাণ নয়। আমরা এটি লুকাই না, দেখাই।',

      'qz.eyebrow': 'খেলে শিখুন', 'qz.h1': 'চল্লিশ বছরের পরিবর্তন চিনতে পারবেন?',
      'qz.lede': 'ছয়টি প্রশ্ন। আসল নাসা ছবি, আসল ট্রেন্ড পরীক্ষা। কোনো অ্যাকাউন্ট নেই, ডাউনলোড নেই — প্রতিটি উত্তর নিজেকে ব্যাখ্যা করে।',
      'qz.q1': 'প্রশ্ন', 'qz.q2': 'সময় লাগবে', 'qz.q3': 'অতিরিক্ত ডাউনলোড', 'qz.start': 'কুইজ শুরু করুন',

      'act.eyebrow': 'পদক্ষেপ নিন', 'act.h1': 'ডেল্টার একজন শিক্ষার্থী আসলে কী করতে পারে?',
      'act.lede': '“পৃথিবী বাঁচান” নয়। তার চেয়ে ছোট, আর বেশি কাজে লাগে: এমন কাজ যা একটি ফ্যান, একটি শেয়ার করা ফোন আর বাইরে বর্ষা — এই অবস্থাতেও সম্ভব।',
      'act.f0': 'সব', 'act.f1': 'বাড়িতে', 'act.f2': 'স্কুলে', 'act.f3': 'সমাজে',
      'act.pledge': 'পদক্ষেপ আপনি বেছে নিয়েছেন', 'act.reset': 'রিসেট',

      'tc.eyebrow': 'শিক্ষকদের জন্য', 'tc.h1': 'রেডিমেড ক্লাসরুম অনুসন্ধান। কোনো যন্ত্রপাতি লাগে না।',
      'tc.lede': 'দুই বা তার বেশি পাইলট এলাকা বেছে নিন — এই পৃষ্ঠা একটি তুলনা সারণি বানাবে যা আপনার ক্লাস পড়তে, প্রশ্ন করতে ও তর্ক করতে পারবে। প্রিন্ট করুন বা প্রজেক্ট করুন।',
      'tc.build': 'তুলনা তৈরি করুন', 'tc.buildSub': 'যে এলাকাগুলো তুলনা করতে চান বেছে নিন।',
      'tc.print': 'প্রিন্ট / PDF সংরক্ষণ',
      'tc.lesson': 'পাঠ পরিকল্পনা · ৩ × ৪৫ মিনিট', 'tc.lessonSub': '৬ষ্ঠ–১০ম শ্রেণি। একবার লোডের পর অফলাইনেও চলে।',
      'tc.l1t': 'আপনি আসলে কোথায় থাকেন?', 'tc.l1p': 'শিক্ষার্থীরা ম্যাপে নিজের জেলা খুঁজে কোঅর্ডিনেট লিখে রাখে। আলোচনা: দেশের নামের চেয়ে কোঅর্ডিনেট কেন বেশি গুরুত্বপূর্ণ?',
      'tc.l2t': 'ছবির জোড়া পড়ুন', 'tc.l2p': 'জোড়ায় শিক্ষার্থীরা দুই তারিখের মধ্যে বদলে যাওয়া তিনটি জিনিস এবং ছবি থেকে বোঝা যায় না এমন একটি জিনিস লিখবে।',
      'tc.l3t': 'প্রবণতা কি সত্যি?', 'tc.l3p': 'চার্ট দেখান, তারপর q-মান। জিজ্ঞেস করুন: এই রেখাকে সন্দেহ করার কারণ কী হতে পারে? অনিশ্চয়তাকে দুর্বলতা নয়, হাতিয়ার হিসেবে পরিচয় করান।',

      'mt.eyebrow': 'পদ্ধতি ও সীমাবদ্ধতা', 'mt.h1': 'আমরা কীভাবে জানি, আর কোথায় জানা থামিয়ে দিই।',
      'mt.lede': 'একটি জলবায়ু দাবি তার কাগজপত্রের মতোই ভালো। এই পৃষ্ঠাটি সেই কাগজপত্র।',
      'mt.m1t': 'প্রশ্ন', 'mt.m1p': '২০০১ থেকে ২০২৪ পর্যন্ত বাংলাদেশের বিভিন্ন ভৌগোলিক অবস্থানে সেপ্টেম্বরের নিকট-পৃষ্ঠ বায়ুর তাপমাত্রা বদলেছে কি — এবং ডেটা-মান ও একাধিক পরীক্ষার যাচাইয়ের পরেও কি ধরনটি টেকে?',
      'mt.m2t': 'সংগ্রহ', 'mt.m2p': 'নাসা POWER-এর মাসিক T2M ও PRECTOTCORR, ১৯৮৫–২০২৪, চারটি পাইলট কোঅর্ডিনেটে। ১,৯২০টি মাসিক রেকর্ড, মূল একক অপরিবর্তিত।',
      'mt.m3t': 'অনুমান', 'mt.m3p': 'থাইল–সেন ঢাল, °C প্রতি দশকে, ৯৫% বুটস্ট্র্যাপ ব্যবধানসহ। আউটলায়ারের প্রতি সাধারণ লিস্ট-স্কয়ারের চেয়ে বেশি প্রতিরোধী।',
      'mt.m4t': 'পরীক্ষা', 'mt.m4p': 'একঘেয়ে প্রবণতার জন্য কেন্ডাল র‍্যাংক কোরিলেশন, তারপর প্রতি সময়ের ৪৮টি এলাকা–মাস সমন্বয়ের জন্য বেনজামিনি–হোকবার্গ।',
      'mt.m5t': 'চ্যালেঞ্জ', 'mt.m5p': 'অন্য শুরু-বছর দিয়ে পুনরাবৃত্তি। ১৯৮৫–২০২৪ সময়ে বিচ্ছিন্নতা খোঁজা। প্রকাশের আগে স্বাধীন রেকর্ডের সাথে মেলানো।',
      'mt.dqBadge': 'ডেটা-মানের আবিষ্কার',
      'mt.dqH': '৪০ বছরের তুলনা যেটা দেখায়, সেটা বলে না।',
      'mt.dqP': 'নাসা POWER-এর কাঁচা সিরিজে ১৯৮৫–১৯৯৪ এবং ২০১৫–২০২৪ মেলালে চারটি এলাকাতেই <em>শীতলতা</em> ইঙ্গিত করে, সাথে অবিশ্বাস্য রকমের বড় বৃষ্টিপাত বৃদ্ধি। ঢাকার দশ-বছরের গড় প্রায় ২৬.৪৯ °C থেকে ২৫.৫১ °C-তে নামে, আর মডেলকৃত বার্ষিক বৃষ্টি ১,১০১ মিমি থেকে ২,৮০৯ মিমি-তে যায়।',
      'mt.dqP2': 'এই সংখ্যাগুলো ডাউনলোড করা তথ্য থেকে গাণিতিকভাবে সঠিক। কিন্তু এগুলো প্রতিষ্ঠিত চল্লিশ বছরের জলবায়ু প্রবণতা নয়। রিঅ্যানালাইসিস নির্ভর করে বদলানো ইনপুট পর্যবেক্ষণ, মডেল সংস্করণ ও সংশোধন পদ্ধতির উপর, এবং সিরিজে প্রোডাক্ট পরিবর্তনের সাথে সামঞ্জস্যপূর্ণ ধাপ-পরিবর্তন দেখা যায়। স্বাধীন পর্যবেক্ষণের সাথে এটি নিষ্পত্তি না হওয়া পর্যন্ত অ্যাপটি এই সময়ের জন্য <strong>এখনও নির্ভরযোগ্য সিদ্ধান্ত নেই</strong> বলে।',
      'mt.lim1': 'এই অ্যাপ যা দাবি করে না',
      'mt.lim1a': 'যে কোনো নদীর গতিপথ পরিবর্তনের কারণ বৈশ্বিক জলবায়ু পরিবর্তন।',
      'mt.lim1b': 'যে POWER-এর মান আপনার বাড়ির থার্মোমিটারের পাঠ।',
      'mt.lim1c': 'যে দুই তারিখের ছবি একটি সময়-সিরিজ।',
      'mt.lim1d': 'যে বাংলাদেশের ফলাফল পৃথিবীর প্রতিটি ডেল্টায় খাটে।',
      'mt.lim2': 'জানা সীমাবদ্ধতা',
      'mt.lim2a': 'POWER হলো মডেলভিত্তিক রিঅ্যানালাইসিস, স্টেশন পরিমাপ নয়।',
      'mt.lim2b': 'MODIS ট্রু কালার ২০০০ থেকে শুরু; সত্যিকারের ১৯৮০-র জোড়ার জন্য ল্যান্ডস্যাট লাগবে।',
      'mt.lim2c': 'বর্ষার মেঘ অনেক তারিখের ব্যবহারযোগ্য দৃশ্য মুছে দেয়।',
      'mt.lim2d': 'সিরিয়াল অটোকোরিলেশন এখনও সম্পূর্ণ সংশোধিত নয়।',
      'mt.srcH': 'প্রাথমিক সূত্র',

      'mt.dsEyebrow': 'ব্যবহৃত নাসা ডেটাসেট',
      'mt.dsH': 'আমরা যে ডেটাসেট ব্যবহার করেছি, কী কাজে, আর কীভাবে অ্যাপে আসে।',
      'mt.dsC1': 'ডেটাসেট', 'mt.dsC2': 'কী কাজে ব্যবহার করেছি', 'mt.dsC3': 'কীভাবে অ্যাপে আসে',
      'mt.aiBadge': 'এআই ব্যবহারের ঘোষণা',
      'mt.aiH': 'এআই কীভাবে ব্যবহার করেছি — নাম, ব্যাখ্যা ও সীমা।',
      'mt.aiP': 'স্পেস অ্যাপস নিয়ম অনুযায়ী সমাধানে ব্যবহৃত প্রতিটি এআই টুলের নাম, তার যুক্তি এবং যে তথ্যে এটি কাজ করেছে — সব ঘোষণা করতে হয়। এখানে আমাদের পূর্ণ ঘোষণা।',
      'mt.aiT1': 'টুল', 'mt.aiT2': 'কী কাজে', 'mt.aiT3': 'যুক্তি',
      'mt.aiT4': 'সংখ্যাগুলো কোথা থেকে', 'mt.aiT5': 'প্রম্পট ও যাচাই',
      'mt.subEyebrow': 'জমা দেওয়া', 'mt.subH': 'বিচারকদের যা দরকার, এক জায়গায়।',

      'ft.challenge': 'আমাদের চ্যালেঞ্জ',
      'ft.theme': 'দ্য নেক্সট ফ্রন্টিয়ার',
      'ft.event': 'বাংলাদেশ লোকাল ইভেন্ট, ১৩–১৪ নভেম্বর ২০২৬',

      'ft.tag': 'নিজের উঠান দিয়েই জলবায়ু পরিবর্তন শেখা।',
      'ft.app': 'অ্যাপ', 'ft.about': 'পরিচিতি', 'ft.data': 'তথ্য',
      'ft.credit': 'ডেল্টা ডিটেকটিভস · নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬',
      'ft.retrieved': 'নাসা তথ্য সংগ্রহ ২৩ অক্টোবর ২০২৬ · অন্বেষণমূলক বিশ্লেষণ'
    }
  };

  let lang = 'en';

  function applyLang(next) {
    lang = next;
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);

    const dict = I18N[lang];
    $$('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if (!k) return;
      if (!el.dataset.en) el.dataset.en = el.innerHTML;
      if (lang === 'en') {
        el.innerHTML = el.dataset.en;
        return;
      }
      const v = dict[k];
      if (!v) return;
      if (v.indexOf('<') > -1) el.innerHTML = v;
      else el.textContent = v;
    });

    const lt = $('#langToggle');
    if (lt) {
      lt.setAttribute('data-lang', lang);
      $$('.lt-opt', lt).forEach(o => o.classList.toggle('is-on', o.dataset.l === lang));
    }
    // re-render language-dependent dynamic blocks
    if (explore.ready && explore.story) renderMeaning(explore.story);
  }

  /* ═══════════════════════ starfield ═══════════════════════ */
  function starfield() {
    const c = $('#starfield');
    if (!c || reduce) return;
    const ctx = c.getContext('2d');
    let stars = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    function build() {
      w = c.width = Math.floor(innerWidth * dpr);
      h = c.height = Math.floor(innerHeight * dpr);
      c.style.width = innerWidth + 'px';
      c.style.height = innerHeight + 'px';
      const n = Math.min(220, Math.floor((innerWidth * innerHeight) / 9000));
      stars = [];
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 1.15 + 0.25) * dpr,
          a: Math.random() * 0.5 + 0.15,
          p: Math.random() * Math.PI * 2,
          s: Math.random() * 0.018 + 0.004
        });
      }
    }

    let t = 0, last = 0;
    function frame(ts) {
      if (document.body.classList.contains('lite')) return;
      if (ts - last < 33) { requestAnimationFrame(frame); return; }
      last = ts;
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const a = s.a + Math.sin(t * 2 + s.p) * 0.18;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + (i % 9 === 0 ? '150,225,255' : '225,235,255') + ',' + Math.max(0.05, a) + ')';
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    build();
    addEventListener('resize', build);
    requestAnimationFrame(frame);
  }

  /* ═══════════════════════ router ═══════════════════════ */
  const views = ['home', 'explore', 'trend', 'quiz', 'act', 'teach', 'method'];
  let current = 'home';

  function go(view, push) {
    if (views.indexOf(view) < 0) view = 'home';
    if (view === current && push !== true) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    current = view;

    $$('.view').forEach(v => v.classList.toggle('is-active', v.id === 'view-' + view));
    $$('.nav-links a').forEach(a => a.classList.toggle('is-active', a.dataset.view === view));

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;

    if (push !== false) {
      try { history.replaceState(null, '', view === 'home' ? location.pathname : '#' + view); } catch (e) {}
    }

    // re-arm reveal animations for the new view
    requestAnimationFrame(() => {
      $$('#view-' + view + ' .reveal').forEach(el => {
        if (!el.classList.contains('in')) io.observe(el);
      });
      if (view === 'explore') onExploreOpen();
      if (view === 'trend') renderHeat(heatPeriod);
      if (view === 'teach') renderTeach();
      if (view === 'act') renderAct();
      if (view === 'method') renderMethod();
    });

    closeMenu();
  }

  function bindNav(root) {
    $$('[data-view]', root || document).forEach(el => {
      if (el.dataset.bound) return;
      el.dataset.bound = '1';
      el.addEventListener('click', e => {
        e.preventDefault();
        go(el.dataset.view);
      });
    });
  }

  /* ═══════════════════════ reveal ═══════════════════════ */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  /* ═══════════════════════ nav ═══════════════════════ */
  function initNav() {
    const nav = $('#nav');
    const bar = $('#scrollBar');
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        nav.classList.toggle('is-stuck', y > 24);
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
        ticking = false;
      });
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const burger = $('#burger');
    const links = $('#navLinks');
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    const lt = $('#langToggle');
    lt.addEventListener('click', () => applyLang(lang === 'en' ? 'bn' : 'en'));

    const lite = $('#liteToggle');
    lite.addEventListener('click', () => {
      const on = document.body.classList.toggle('lite');
      lite.setAttribute('aria-pressed', on ? 'true' : 'false');
      toast(on ? 'Low-data mode on — imagery reduced to 320 px' : 'Low-data mode off');
      if (explore.ready && explore.story) renderSlider(explore.story);
    });

    bindNav(document);
  }

  function closeMenu() {
    const links = $('#navLinks'), b = $('#burger');
    if (links) links.classList.remove('open');
    if (b) b.setAttribute('aria-expanded', 'false');
  }

  /* ═══════════════════════ toast ═══════════════════════ */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2600);
  }

  /* ═══════════════════════ ticker ═══════════════════════ */
  function initTicker() {
    const track = $('#tickerTrack');
    if (!track) return;
    const items = [
      'The Next Frontier · 13–14 Nov 2026',
      'NASA POWER · 1,920 monthly records',
      'GISTEMP v4 · 1880 → 2025',
      'MODIS Terra · 250 m per pixel',
      '4 pilot sites · 96 trend tests',
      'Theil–Sen · Kendall τ · Benjamini–Hochberg',
      '2024 global anomaly +1.28 °C',
      'Bangla · English · low-bandwidth',
      'Every claim has a passport',
      'Landsat archive since 1984',
      'No API key required'
    ];
    const html = items.map(t => '<span class="tk"><i></i><b>' + t + '</b></span>').join('');
    track.innerHTML = html + html;
  }

  /* ═══════════════════════ home peek slider ═══════════════════════ */
  function initPeek() {
    const el = $('#homeBa');
    if (!el) return;
    const ba = window.MC.BeforeAfter(el);
    const bhola = SITES.filter(s => s.id === 'bhola')[0] || SITES[0];
    ba.load({
      lat: bhola.lat, lon: bhola.lon, aspect: 16 / 9, latSpan: 0.9,
      layer: 'true', dateA: '2000-11-15', dateB: '2024-11-15',
      yearA: '2000', yearB: '2024', w: 1280
    });
  }

  /* ═══════════════════════ EXPLORE ═══════════════════════ */
  const explore = { ready: false, story: null, layer: 'true', map: null, ba: null, siteIdx: 0 };

  function storyFromSite(s) {
    return {
      id: s.id,
      name: s.name, bn: s.bn, kind: s.kind, lat: s.lat, lon: s.lon,
      sept: s.sept, annual: s.annual, clim: s.clim,
      trend: s.trend, t2024: s.t2024, p2024: s.p2024,
      isPilot: true, dq: s.dq, note: s.note
    };
  }

  function initExplore() {
    if (explore.ready) return;
    explore.ready = true;

    explore.ba = window.MC.BeforeAfter($('#mainBa'));

    // site list
    const list = $('#siteList');
    list.innerHTML = '';
    SITES.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'site-item';
      b.dataset.idx = i;
      b.innerHTML =
        '<span class="si-flag">' + s.name.slice(0, 2).toUpperCase() + '</span>' +
        '<span class="si-body"><span class="si-name">' + s.name + '</span>' +
        '<span class="si-kind">' + s.kind + '</span></span>' +
        '<span class="si-trend">+' + s.trend.slope.toFixed(2) + '°</span>';
      b.addEventListener('click', () => selectSite(i));
      list.appendChild(b);
    });

    // search
    const search = $('#placeSearch');
    search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      $$('.site-item', list).forEach(item => {
        const s = SITES[+item.dataset.idx];
        const hay = (s.name + ' ' + s.kind + ' ' + s.bn).toLowerCase();
        item.style.display = !q || hay.indexOf(q) > -1 ? '' : 'none';
      });
    });

    // coordinates
    const go = () => {
      const lat = parseFloat($('#latInput').value);
      const lon = parseFloat($('#lonInput').value);
      if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) {
        toast('Enter a latitude between -85 and 85 and a longitude between -180 and 180');
        return;
      }
      loadCustom(lat, lon);
    };
    $('#coordGo').addEventListener('click', go);
    ['#latInput', '#lonInput'].forEach(sel => {
      $(sel).addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    });

    // layer segment
    $$('#layerSeg button').forEach(b => {
      b.addEventListener('click', () => {
        $$('#layerSeg button').forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on');
        explore.layer = b.dataset.layer;
        if (explore.story) renderSlider(explore.story);
      });
    });

    // slider actions
    $('#baReset').addEventListener('click', () => explore.ba.reset());
    $('#baFull').addEventListener('click', () => {
      const card = $('#mainBa');
      if (!document.fullscreenElement) {
        (card.requestFullscreen ? card.requestFullscreen() : Promise.reject()).catch(() => toast('Fullscreen is not available here'));
      } else {
        document.exitFullscreen();
      }
    });

    // map
    explore.map = window.MC.initMap($('#railMap'), SITES, (lat, lon, id) => {
      if (id) {
        const idx = SITES.findIndex(s => s.id === id);
        selectSite(idx);
      } else {
        $('#latInput').value = lat.toFixed(4);
        $('#lonInput').value = lon.toFixed(4);
        loadCustom(lat, lon);
      }
    });
  }

  function onExploreOpen() {
    initExplore();
    if (explore.map) setTimeout(() => explore.map.invalidate(), 120);
    if (!explore.story) selectSite(0);
    else if (explore.map) explore.map.focus(explore.story.lat, explore.story.lon, explore.story.id);
  }

  function selectSite(i) {
    explore.siteIdx = i;
    const s = SITES[i];
    $$('.site-item').forEach((el, k) => el.classList.toggle('is-on', k === i));
    $('#latInput').value = s.lat.toFixed(4);
    $('#lonInput').value = s.lon.toFixed(4);
    if (explore.map) explore.map.focus(s.lat, s.lon, s.id);
    renderStory(storyFromSite(s));
  }

  async function loadCustom(lat, lon) {
    $$('.site-item').forEach(el => el.classList.remove('is-on'));
    const stage = $('#stage');
    if (stage) stage.classList.add('is-loading');
    $('#locName').textContent = 'Reading NASA data…';
    $('#locKind').textContent = 'Live POWER request';
    $('#locCoords').textContent = Math.abs(lat).toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S') + ', ' +
      Math.abs(lon).toFixed(4) + '° ' + (lon >= 0 ? 'E' : 'W');
    toast('Calling NASA POWER for this coordinate…');
    try {
      const story = await window.PowerAPI.storyFor(lat, lon);
      renderStory(story);
      toast('Live NASA POWER data loaded');
    } catch (err) {
      toast('Could not retrieve POWER data here: ' + err.message);
      $('#locName').textContent = 'No time series';
      $('#locKind').textContent = 'Insufficient coverage';
      $('#meaningText').innerHTML =
        'This point does not have enough usable NASA POWER coverage for a trend. ' +
        'Imagery may still be available — try a nearby coordinate, or pick a pilot site.';
    } finally {
      if (stage) stage.classList.remove('is-loading');
    }
  }

  function renderStory(story) {
    explore.story = story;
    const n = story.name;

    $('#locName').textContent = n;
    $('#locKind').textContent = story.kind;
    $('#locCoords').textContent =
      Math.abs(story.lat).toFixed(4) + '° ' + (story.lat >= 0 ? 'N' : 'S') + ', ' +
      Math.abs(story.lon).toFixed(4) + '° ' + (story.lon >= 0 ? 'E' : 'W');

    const tr = story.trend;
    $('#locTrend').innerHTML = (tr.slope >= 0 ? '+' : '') + tr.slope.toFixed(2) +
      ' °C<span>/decade</span>';
    const sig = tr.q < 0.05;
    $('#locConf').textContent = (story.isPilot ? 'q = ' : 'p = ') +
      tr.q.toFixed(tr.q < 0.01 ? 4 : 3) + ' · ' + (sig ? 'significant' : 'not significant');
    $('#locConf').style.color = sig ? 'var(--aurora)' : 'var(--dim)';

    renderSlider(story);
    renderTemp(story);
    renderRain(story);
    renderMeaning(story);
    renderPassport(story);
    renderGlobal();
  }

  function renderSlider(story) {
    const el = $('#mainBa');
    const aspect = 16 / 9;
    explore.ba.load({
      lat: story.lat, lon: story.lon, aspect, latSpan: 0.9,
      layer: explore.layer,
      dateA: '2000-11-15', dateB: '2024-11-15',
      yearA: '2000', yearB: '2024', w: 1200
    });
    $('#chipLayer').textContent = 'MODIS Terra · ' + (explore.layer === 'true' ? 'True colour' : 'False colour 7-2-1');
    $('#chipDates').textContent = '15 Nov 2000 → 15 Nov 2024';
  }

  function renderTemp(story) {
    const host = $('#tempChart');
    if (!host) return;
    const data = story.sept.map(d => ({ x: d[0], y: d[1] })).filter(d => d.y != null);
    if (!data.length) { host.innerHTML = '<p class="ct-empty">No temperature series available.</p>'; return; }
    const xs = data.map(d => d.x), ys = data.map(d => d.y);
    const slope = story.trend.slope / 10;
    const b = median(ys.map((y, i) => y - slope * xs[i]));
    const meanX = xs.reduce((a, c) => a + c, 0) / xs.length;

    $('#tempSub').textContent = data[0].x + ' – ' + data[data.length - 1].x +
      ' · NASA POWER MERRA-2 · n = ' + data.length;
    $('#tempPill').textContent = (story.trend.slope >= 0 ? '+' : '') +
      story.trend.slope.toFixed(2) + ' °C / decade';

    window.Charts.line(host, {
      data: data,
      color: '#ff7a45', fill: true, unit: ' °C', label: 'September mean',
      yFormat: v => v.toFixed(1) + '°',
      trend: {
        slope: slope, lo: story.trend.lo / 10, hi: story.trend.hi / 10,
        anchorX: meanX, anchorY: b + slope * meanX
      },
      xTicks: 6, yPad: 0.2
    });
  }

  function renderRain(story) {
    const host = $('#rainChart');
    if (!host) return;
    const data = story.annual.map(d => ({ x: d[0], y: d[1], p: d[2] })).filter(d => d.p != null);
    if (!data.length) { host.innerHTML = '<p class="ct-empty">No rainfall series available.</p>'; return; }

    $('#rainSub').textContent = data[0].x + ' – ' + data[data.length - 1].x + ' · modelled estimate';
    const lastRain = story.p2024 || data[data.length - 1].p;
    $('#rainPill').textContent = Math.round(lastRain).toLocaleString() + ' mm in 2024';

    window.Charts.line(host, {
      data: data.map(d => ({ x: d.x, y: d.p })), color: '#2ee6c5', fill: true,
      unit: ' mm', label: 'Annual rainfall',
      yFormat: v => (v / 1000).toFixed(1) + 'k',
      xTicks: 6, yPad: 0.22
    });
  }

  function renderMeaning(story) {
    const el = $('#meaningText');
    if (!el) return;
    const d = Math.abs(story.trend.slope * 2.3);
    const q = story.trend.q;
    const qs = q < 0.001 ? '< 0.001' : q.toFixed(4);
    const nameBn = story.bn || story.name;

    if (lang === 'bn' && story.bn) {
      el.innerHTML = '২০০১ সালের তুলনায় ' + nameBn + ' এলাকায় সেপ্টেম্বর এখন প্রায় <b>' +
        d.toFixed(1) + ' °C</b> বেশি গরম — এবং একাধিক পরীক্ষার সংশোধনের পরেও এই প্রবণতা টিকে থাকে (q = ' + qs + ')।';
    } else {
      el.innerHTML = 'September in ' + story.name + ' is about <b>' + d.toFixed(1) +
        ' °C</b> warmer than it was in 2001 — and the trend survives a correction for multiple testing (q = ' + qs + ').';
    }
    $('#meaningNum').textContent = (story.trend.slope >= 0 ? '+' : '') + story.trend.slope.toFixed(2);
  }

  function renderPassport(story) {
    const grid = $('#ppGrid');
    const t = story.trend;
    const sig = t.q < 0.05;

    const cells = [
      ['Dataset', 'NASA POWER · MERRA-2', 'T2M near-surface air temperature'],
      ['Window', 'September 2001–2024', 'n = ' + story.sept.length + ' years'],
      ['Location', Math.abs(story.lat).toFixed(4) + '° ' + (story.lat >= 0 ? 'N' : 'S'),
        Math.abs(story.lon).toFixed(4) + '° ' + (story.lon >= 0 ? 'E' : 'W') + ' · grid cell, not a station'],
      ['Method', 'Theil–Sen + Kendall τ', story.isPilot ? 'BH across 48 tests' : 'single test, uncorrected'],
      ['Slope', (t.slope >= 0 ? '+' : '') + t.slope.toFixed(3) + ' °C / decade', 'robust median of pairwise slopes'],
      ['95% interval', (t.lo >= 0 ? '+' : '') + t.lo.toFixed(3) + ' → ' + (t.hi >= 0 ? '+' : '') + t.hi.toFixed(3), 'bootstrap, 400 resamples'],
      ['Kendall τ', t.tau.toFixed(3), 'monotonic trend statistic'],
      [story.isPilot ? 'Adjusted q' : 'p value', (t.q < 0.001 ? '< 0.001' : t.q.toFixed(4)),
        sig ? 'significant at 0.05' : 'not significant at 0.05']
    ];

    grid.innerHTML = cells.map(c =>
      '<dl class="pp-cell"><dt>' + c[0] + '</dt><dd>' + c[1] +
      (c[2] ? '<small>' + c[2] + '</small>' : '') + '</dd></dl>'
    ).join('');

    $('#ppStatus').textContent = sig ? 'Passed quality checks' : 'Exploratory only';
    $('#ppStatus').style.color = sig ? 'var(--aurora)' : 'var(--gold)';
    $('#ppStatus').style.borderColor = sig ? 'rgba(46,230,197,.3)' : 'rgba(255,200,97,.32)';

    $('#ppCaveat').textContent = story.isPilot
      ? 'POWER is modelled reanalysis on a coarse grid, not a thermometer at this address. Serial autocorrelation in the yearly September series has not yet been fully corrected, and no independent ground record has been cross-checked for this site. Treat the slope as exploratory until it is.'
      : 'This coordinate was analysed live in your browser with the same method as the pilot sites, but as a single uncorrected test. No Benjamini–Hochberg correction was applied, and no independent cross-validation exists for this point.';
  }

  function renderGlobal() {
    const host = $('#globalChart');
    if (!host || host.dataset.done) return;
    host.dataset.done = '1';
    window.Charts.line(host, {
      data: D.gistemp.map(d => ({ x: d[0], y: d[1] })),
      color: '#8b7cf6', fill: true, unit: ' °C', label: 'Global anomaly',
      yFormat: v => (v > 0 ? '+' : '') + v.toFixed(1) + '°',
      xTicks: 7, yPad: 0.16, zero: true, animate: true
    });
  }

  /* ═══════════════════════ TREND LAB ═══════════════════════ */
  let heatPeriod = 2001;

  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
  function mix(c1, c2, t) {
    return 'rgb(' + lerp(c1[0], c2[0], t) + ',' + lerp(c1[1], c2[1], t) + ',' + lerp(c1[2], c2[2], t) + ')';
  }
  const C_ZERO = [24, 32, 48], C_WARM = [255, 122, 69], C_COOL = [46, 230, 197];

  function renderHeat(period) {
    const host = $('#heatmap');
    if (!host) return;
    heatPeriod = period;

    const rows = SITES.map(s => s.name);
    const filtered = D.trends.filter(t => t.start === period);
    let maxAbs = 0.01;
    filtered.forEach(t => { maxAbs = Math.max(maxAbs, Math.abs(t.slope)); });

    host.innerHTML = '';

    // header row
    host.appendChild(Object.assign(document.createElement('div'), { className: 'h-site' }));
    MONTHS.forEach((m, i) => {
      const d = document.createElement('div');
      d.className = 'h-month';
      d.textContent = m;
      host.appendChild(d);
    });

    rows.forEach(site => {
      const label = document.createElement('div');
      label.className = 'h-site';
      label.innerHTML = '<b>' + site + '</b><span>' +
        (period === 2001 ? '24 yrs' : '40 yrs') + '</span>';
      host.appendChild(label);

      for (let m = 1; m <= 12; m++) {
        const rec = filtered.find(t => t.site === site && t.month === m);
        const cell = document.createElement('div');
        cell.className = 'hcell';
        if (!rec) { cell.style.background = '#0e1626'; host.appendChild(cell); continue; }

        const v = Math.max(-1, Math.min(1, rec.slope / maxAbs));
        const t = Math.abs(v);
        cell.style.background = v >= 0 ? mix(C_ZERO, C_WARM, Math.pow(t, 0.75))
                                      : mix(C_ZERO, C_COOL, Math.pow(t, 0.75));
        if (rec.q < 0.05) cell.classList.add('is-sig');

        cell.addEventListener('mouseenter', () => showHeat(site, m, rec, maxAbs));
        cell.addEventListener('click', () => showHeat(site, m, rec, maxAbs));
        host.appendChild(cell);
      }
    });

    $$('#periodSeg button').forEach(b => b.classList.toggle('is-on', +b.dataset.period === period));
  }

  function showHeat(site, month, rec, maxAbs) {
    const el = $('#heatDetail');
    if (!el) return;
    const sig = rec.q < 0.05;
    const col = rec.slope >= 0 ? 'var(--ember)' : 'var(--aurora)';
    el.innerHTML =
      '<div class="hd-site">' + site + ' · ' + (rec.start === 2001 ? '2001–2024' : '1985–2024') + '</div>' +
      '<div class="hd-month">' + MONTHS[month - 1] + '</div>' +
      '<div class="hd-val" style="color:' + col + '">' + (rec.slope >= 0 ? '+' : '') + rec.slope.toFixed(2) + '</div>' +
      '<div class="hd-unit">°C per decade</div>' +
      '<div class="hd-rows">' +
        '<div class="hd-row"><span>95% low</span><b>' + rec.lo.toFixed(2) + '</b></div>' +
        '<div class="hd-row"><span>95% high</span><b>' + rec.hi.toFixed(2) + '</b></div>' +
        '<div class="hd-row"><span>Kendall τ</span><b>' + rec.tau.toFixed(2) + '</b></div>' +
        '<div class="hd-row"><span>raw p</span><b>' + (rec.p < 0.001 ? '< 0.001' : rec.p.toFixed(3)) + '</b></div>' +
        '<div class="hd-row"><span>BH q</span><b>' + (rec.q < 0.001 ? '< 0.001' : rec.q.toFixed(3)) + '</b></div>' +
      '</div>' +
      '<div class="hd-verdict ' + (sig ? 'yes' : 'no') + '">' +
        (sig ? 'Significant after correction' : 'Not significant after correction') + '</div>';
  }

  /* ═══════════════════════ ACT ═══════════════════════ */
  const ACTIONS = [
    { c: 'home', t: 'Shade one window properly', d: 'A curtain plus a coat of white on the roof can drop a room by 2–3 °C. Cheapest air conditioning there is.', tags: ['Heat', 'Low cost'], hi: true },
    { c: 'home', t: 'Catch rain before it leaves', d: 'A 200-litre drum under one downpipe stores a month of household water in the wet season.', tags: ['Water', 'Low cost'] },
    { c: 'home', t: 'Cook without adding heat', d: 'One daily meal moved to a solar cooker removes indoor smoke and indoor heat at the same time.', tags: ['Health'] },
    { c: 'school', t: 'Plant a shade line, not scattered trees', d: 'Six fast-growing trees along the west wall cool a classroom more than a dozen saplings dotted around the field.', tags: ['Heat', 'Shade'] },
    { c: 'school', t: 'Make your school a data point', d: 'Record temperature and rainfall at the same time every day. Two years of records is real evidence nobody else has.', tags: ['Evidence'], hi: true },
    { c: 'school', t: 'Run the Trend Lab as a lesson', d: 'The teacher pack runs in one class period with no equipment and ends in an honest argument about uncertainty.', tags: ['Teaching'] },
    { c: 'community', t: 'Photograph the riverbank every November', d: 'One photo from one fixed spot each year builds the thing satellites cannot give you: ground truth.', tags: ['Ground truth'], hi: true },
    { c: 'community', t: 'Paint the flood line on a wall', d: 'Mark the highest water. When NASA flood maps arrive, your street can check them.', tags: ['Flood'] },
    { c: 'community', t: 'Share the story, not the fear', d: 'One local chart beats one global warning. “September is 1 °C warmer here” lands; “the planet is doomed” does not.', tags: ['Communication'] }
  ];

  function renderAct() {
    const grid = $('#actGrid');
    if (!grid || grid.dataset.done) return;
    grid.dataset.done = '1';

    grid.innerHTML = ACTIONS.map((a, i) =>
      '<button class="act-card" data-cat="' + a.c + '" data-i="' + i + '">' +
        '<div class="ac-top">' +
          '<span class="ac-ico">' + actIcon(a.c) + '</span>' +
          '<span class="ac-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
        '</div>' +
        '<div class="ac-title">' + a.t + '</div>' +
        '<p class="ac-desc">' + a.d + '</p>' +
        '<div class="ac-meta">' + a.tags.map(t =>
          '<span class="ac-tag' + (a.hi ? ' hi' : '') + '">' + t + '</span>').join('') + '</div>' +
      '</button>'
    ).join('');

    $$('.act-card', grid).forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('is-done');
        updatePledge();
      });
    });

    $$('.chip-btn').forEach(b => {
      b.addEventListener('click', () => {
        $$('.chip-btn').forEach(x => x.classList.remove('is-on'));
        b.classList.add('is-on');
        const f = b.dataset.filter;
        $$('.act-card', grid).forEach(c => {
          c.style.display = f === 'all' || c.dataset.cat === f ? '' : 'none';
        });
      });
    });

    const reset = $('#pledgeReset');
    if (reset) reset.addEventListener('click', () => {
      $$('.act-card', grid).forEach(c => c.classList.remove('is-done'));
      updatePledge();
    });

    updatePledge();
  }

  function actIcon(c) {
    const paths = {
      home: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" stroke-linejoin="round"/>',
      school: '<path d="M3 10 12 4l9 6-9 6z" stroke-linejoin="round"/><path d="M6 12.5V18c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-5.5" stroke-linecap="round"/>',
      community: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke-linecap="round"/><circle cx="17" cy="9.5" r="2.2"/><path d="M15 19a4.6 4.6 0 0 1 6.2-3.7" stroke-linecap="round"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' + (paths[c] || paths.home) + '</svg>';
  }

  function updatePledge() {
    const n = $$('.act-card.is-done').length;
    const el = $('#pledgeNum');
    if (el) el.textContent = n;
  }

  /* ═══════════════════════ TEACHERS ═══════════════════════ */
  const teachSel = new Set(['Dhaka', 'Bhola']);

  function renderTeach() {
    const picker = $('#teachPicker');
    if (!picker) return;
    if (!picker.dataset.done) {
      picker.dataset.done = '1';
      picker.innerHTML = SITES.map(s =>
        '<button class="tp-btn' + (teachSel.has(s.name) ? ' is-on' : '') + '" data-site="' + s.name + '">' +
        '<span class="tp-dot"></span>' + s.name + '</button>'
      ).join('');
      $$('.tp-btn', picker).forEach(b => {
        b.addEventListener('click', () => {
          const n = b.dataset.site;
          if (teachSel.has(n)) teachSel.delete(n); else teachSel.add(n);
          b.classList.toggle('is-on');
          renderTeachTable();
        });
      });
      const p = $('#printBtn');
      if (p) p.addEventListener('click', () => window.print());
    }
    renderTeachTable();
  }

  function renderTeachTable() {
    const out = $('#teachOut');
    if (!out) return;
    const rows = SITES.filter(s => teachSel.has(s.name));
    if (!rows.length) {
      out.innerHTML = '<p class="ct-empty">Select at least one site to build the table.</p>';
      return;
    }
    out.innerHTML =
      '<table class="ctable"><thead><tr>' +
        '<th>Site</th><th>Sept trend</th><th>95% range</th><th>Adjusted q</th><th>2024 mean T</th><th>2024 rainfall</th>' +
      '</tr></thead><tbody>' +
      rows.map(s =>
        '<tr><td>' + s.name + '</td>' +
        '<td class="num hot">+' + s.trend.slope.toFixed(2) + ' °C/dec</td>' +
        '<td class="num">' + s.trend.lo.toFixed(2) + ' → ' + s.trend.hi.toFixed(2) + '</td>' +
        '<td class="num">' + (s.trend.q < 0.001 ? '< 0.001' : s.trend.q.toFixed(3)) + '</td>' +
        '<td class="num">' + s.t2024.toFixed(1) + ' °C</td>' +
        '<td class="num">' + Math.round(s.p2024).toLocaleString() + ' mm</td></tr>'
      ).join('') +
      '</tbody></table>' +
      '<p class="ct-empty" style="padding-top:14px">Trend period: September 2001–2024, NASA POWER MERRA-2. ' +
      'q-values are Benjamini–Hochberg adjusted across 48 site–month tests. ' +
      'Discuss: which row surprised you, and why?</p>';
  }

  /* ═══════════════════════ METHOD ═══════════════════════ */
  function renderSubmission() {
    const grid = $('#subGrid');
    if (!grid || grid.dataset.done) return;
    grid.dataset.done = '1';

    const ext = (url, label) =>
      '<a href="' + url + '" target="_blank" rel="noopener">' + label + '</a>';

    const repoCell = CONFIG.repo
      ? ext(CONFIG.repo, 'Public GitHub repository') + '<small>code, documentation and data pipeline</small>'
      : 'Linked from the NASA project page<small>open access, no login required</small>';

    const videoCell = CONFIG.video
      ? ext(CONFIG.video, '30-second final video') + '<small>YouTube · subtitled</small>'
      : 'Linked from the NASA project page<small>30 seconds, English subtitles</small>';

    const cells = [
      ['Challenge', ext(CHALLENGE_URL, 'Be an Earth System Trend Detective') +
        '<small>the only challenge this project answers</small>'],
      ['Event', 'Bangladesh Local Events<small>13–14 November 2026 · one day ahead of the 14–15 global window</small>'],
      ['Team', 'Delta Detectives<small>registered on the NASA project page with roles</small>'],
      ['Repository', repoCell],
      ['Demo video', videoCell],
      ['Data licence', 'NASA open data<small>public domain · POWER, GIBS, GISTEMP</small>']
    ];

    grid.innerHTML = cells.map(c =>
      '<dl class="sub-cell"><dt>' + c[0] + '</dt><dd>' + c[1] + '</dd></dl>'
    ).join('');

    const team = $('#subTeam');
    if (team) {
      team.innerHTML = CONFIG.team.length
        ? CONFIG.team.map(m =>
            '<span class="team-chip"><b>' + m.name + '</b><em>' + m.role + '</em></span>'
          ).join('')
        : '<span class="sub-note">Every team member is registered on the NASA project page with a photo and their role, as the rules require.</span>';
    }
  }

  function wireFooterLinks() {
    const pairs = [['#footRepo', CONFIG.repo], ['#footVideo', CONFIG.video]];
    pairs.forEach(([sel, url]) => {
      const el = $(sel);
      if (el && url) { el.href = url; el.hidden = false; }
    });
  }

  function renderMethod() {
    renderSubmission();

    const t = $('#dqTable');
    if (t && !t.dataset.done) {
      t.dataset.done = '1';
      t.innerHTML = SITES.map(s =>
        '<dl class="dq-cell"><dt>' + s.name + ' · mean T</dt>' +
        '<dd>' + s.dq.tEarly.toFixed(2) + ' → ' + s.dq.tLate.toFixed(2) + ' °C</dd></dl>' +
        '<dl class="dq-cell"><dt>' + s.name + ' · rainfall</dt>' +
        '<dd>' + Math.round(s.dq.pEarly).toLocaleString() + ' → ' +
        Math.round(s.dq.pLate).toLocaleString() + ' mm</dd></dl>'
      ).join('');
    }

    const list = $('#sourceList');
    if (list && !list.dataset.done) {
      list.dataset.done = '1';
      const sources = [
        ['NASA POWER monthly API', 'https://power.larc.nasa.gov/docs/services/api/temporal/monthly/'],
        ['NASA POWER parameter dictionary', 'https://power.larc.nasa.gov/parameters/'],
        ['NASA GISTEMP v4 tables', 'https://data.giss.nasa.gov/gistemp/data_v4.html'],
        ['NASA Worldview & GIBS', 'https://worldview.earthdata.nasa.gov/'],
        ['NASA Landsat data overview', 'https://science.nasa.gov/mission/landsat/data-overview/'],
        ['MODIS MOD13Q1 NDVI', 'https://search.earthdata.nasa.gov/search?q=MOD13Q1'],
        ['NASA GPM IMERG rainfall', 'https://gpm.nasa.gov/data/imerg'],
        ['NASA OPERA surface water', 'https://www.jpl.nasa.gov/go/opera/'],
        ['Space Apps 2026 challenge', 'https://www.spaceappschallenge.org/2026/challenges/be-an-earth-system-trend-detective/'],
        ['MERRA-2 reanalysis', 'https://www.earthdata.nasa.gov/data/projects/merra-2']
      ];
      list.innerHTML = sources.map(s =>
        '<li><a href="' + s[1] + '" target="_blank" rel="noopener">' + s[0] +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M9 7h8v8" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>'
      ).join('');
    }
  }

  /* ═══════════════════════ boot ═══════════════════════ */
  function boot() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    initNav();
    initTicker();
    initPeek();
    wireFooterLinks();

    $$('.reveal').forEach(el => io.observe(el));
    // anything already in view
    setTimeout(() => $$('.reveal').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
    }), 60);

    window.Quiz.init();
    window.MC.bindNav = bindNav;

    const hash = (location.hash || '').replace('#', '');
    go(views.indexOf(hash) > -1 ? hash : 'home', false);

    // smooth anchor scrolling inside home
    $$('a[href^="#"]').forEach(a => {
      if (a.dataset.view) return;
      a.addEventListener('click', e => {
        const id = a.getAttribute('href').slice(1);
        const t = document.getElementById(id);
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('hashchange', () => {
      const h = (location.hash || '').replace('#', '');
      if (h && views.indexOf(h) > -1 && h !== current) go(h, false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
