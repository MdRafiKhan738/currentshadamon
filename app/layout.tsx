import "./globals.css";
import {LanguageProvider} from "./context/LanguageContext";
import {SettingsProvider} from "./context/SettingsContext";
import {Toaster} from "react-hot-toast";
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><LanguageProvider><SettingsProvider>{children}</SettingsProvider></LanguageProvider><Toaster position="top-right"/></body></html>}