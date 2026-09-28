"use client";
import React,{createContext,useContext,useState,useEffect,ReactNode} from "react";
import Cookies from "js-cookie";
// hello just checking

type Language="bn"|"en";
const translations:Record<string,Record<Language,string>>={dashboard:{bn:"ড্যাশবোর্ড",en:"Dashboard"},home:{bn:"হোম",en:"Home"},search_nav:{bn:"সার্চ",en:"Search"},inbox:{bn:"ইনবক্স",en:"Inbox"},account:{bn:"প্রোফাইল",en:"Profile"},logout:{bn:"লগআউট",en:"Logout"},settings:{bn:"সেটিংস",en:"Settings"},category:{bn:"ক্যাটাগরি",en:"Category"},location:{bn:"অবস্থান",en:"Location"},filters:{bn:"ফিল্টার",en:"Filters"},all:{bn:"সব",en:"All"},promoted:{bn:"প্রচারিত",en:"Promoted"},cancel:{bn:"বন্ধ করুন",en:"Cancel"},post_ad_btn:{bn:"বিজ্ঞাপন পোস্ট করুন",en:"Post Ad Now"},headline:{bn:"শিরোনাম",en:"Headline"},description:{bn:"বিবরণ",en:"Description"},select_category:{bn:"ক্যাটাগরি নির্বাচন করুন",en:"Select a category"},loading_feed:{bn:"লোড হচ্ছে...",en:"Loading feed..."},no_ads_yet:{bn:"এখনো কোন বিজ্ঞাপন নেই",en:"No Ads Yet"}};
const C=createContext<any>(undefined);
export function LanguageProvider({children}:{children:ReactNode}){const [language,setLanguageState]=useState<Language>("en");useEffect(()=>{const s=Cookies.get("app_lang") as Language;if(s==="bn"||s==="en")setLanguageState(s)},[]);const setLanguage=(l:Language)=>{setLanguageState(l);Cookies.set("app_lang",l,{expires:365})};const t=(k:string)=>translations[k]?.[language]||k;return <C.Provider value={{language,setLanguage,t}}>{children}</C.Provider>}
export function useLanguage(){const c=useContext(C);if(!c)throw new Error("useLanguage must be used within a LanguageProvider");return c}
