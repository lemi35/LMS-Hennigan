//tsrfce
//import { url } from 'inspector';
import Link from 'next/dist/client/link';
import React from 'react'

export const navItemsData = [
    {
        name: "Home",
        url: "/"
    },
    {
        name: "About",
        url: "/about"
    },
    {
        name: "Classes",
        url: "/classes"
    },
    {
        name: "Contact",
        url: "/contact"
    },
    {
        name: "FAQ",
        url: "/faq"
    }
]

type Props = {
    activeItem: number;
    isMobile: boolean;
}

const NavItems: React.FC<Props> = ({ activeItem, isMobile }) => {

  if (isMobile) {
    return (
      <div className="flex flex-col items-start">
        {navItemsData.map((item, index) => (
          <Link
            key={index}
            href={item.url}
            className={`font-Poppins font-medium text-[16px] my-2 ${
              activeItem === index
                ? "text-green-700"
                : "text-gray-700 dark:text-gray-300"
            } hover:text-green-700 transition duration-300`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="flex items-center">
      {navItemsData.map((item, index) => (
        <Link
          key={index}
          href={item.url}
          className={`font-Poppins font-medium text-[16px] mx-4 ${
            activeItem === index
              ? "text-green-700"
              : "text-gray-700 dark:text-gray-300"
          } hover:text-green-700 transition duration-300`}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};
export default NavItems;