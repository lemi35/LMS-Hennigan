'use client';
import Link from "next/link";
import { useEffect, useState } from "react";
import NavItems from "./NavItems";
import { ThemeSwitcher } from "../utils/ThemeSwitcher";
import { HiOutlineMenuAlt3, HiOutlineUser, HiOutlineUserCircle, HiOutlineX } from "react-icons/hi";




// Header component with scroll effect, responsive navigation, and theme switcher
export default function Header() {
  const [active, setActive] = useState(false);
  const [activeItem, setActiveItem] = useState(0);
  const [openSideBar, setOpenSideBar] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setActive(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="w-full relative">
      <div
        className={`${
          active
            ? "fixed top-0 left-0 w-full min-h-20 z-50 border-b dark:border-white/10 shadow-xl transition duration-500 dark:bg-linear-to-b dark:from-gray-900 dark:to-black"
            : "w-full h-20 border-b dark:border-white/10"
        }`}
      >
        <div className="w-[95%] m-auto h-full flex items-center justify-between">

  <Link
    href="/"
    className="text-grey text-sm sm:text-base md:text-lg lg:text-xl font-poppins font-medium"
  >
    Hennigan Irish Dance School
  </Link>

  {/* Desktop menu */}
  <div className="hidden lg:flex">
    <NavItems 
      activeItem={activeItem} 
      isMobile={false} 
    />
  </div>

  <div className="flex items-center gap-4">
    <ThemeSwitcher />

    {/* Mobile hamburger */}
    <div className="lg:hidden">
      <HiOutlineMenuAlt3
        className="text-grey cursor-pointer"
        onClick={() => setOpenSideBar(true)}
        size={25}
      />
    </div>

    <HiOutlineUserCircle 
      size={25}
      className="text-grey cursor-pointer"
      onClick={() => setOpen(true)}
    />
  </div>

        </div>
        {/* Mobile sidebar */}
        {openSideBar && (
          <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-50 flex">
            <div className="w-[70%] h-full bg-white dark:bg-gray-800 p-4">
              <div className="flex items-center justify-end mb-4">
                <HiOutlineX
                  className="text-gray-800 dark:text-white cursor-pointer"
                  onClick={() => setOpenSideBar(false)}
                  size={25}
                />
                
              </div>
              <NavItems 
                activeItem={activeItem} 
                isMobile={true} />
            </div>
            <div
              className="w-[30%] h-full cursor-pointer"
              onClick={() => setOpenSideBar(false)}
            />
          </div>
        )}

        {/* Mobile user dropdown */}
        {open && (
          
          <div className="absolute top-16 right-4 w-48 bg-white dark:bg-gray-800 rounded shadow-lg z-50">
            <HiOutlineX
                  className="text-gray-800 dark:text-white cursor-pointer"
                  onClick={() => setOpen(false)}
                  size={25}
                />
            <Link
              href="/profile"
              className="block px-4 py-2 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300"
            >
              Profile
            </Link>
            <Link
              href="/settings"
              className="block px-4 py-2 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300"
            >
              Settings
            </Link>
            <Link
              href="/logout"
              className="block px-4 py-2 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition duration-300"
            >
              Logout
            </Link>
             <br/>
            <br/>
            <br/> 
            <p className="text-xs m-2 text-gray-800 dark:text-gray-300">Copyright @ 2023 Hennigan Irish Dance Finland</p>
          </div>
        )}
      </div>
     
    </div>
  );
}