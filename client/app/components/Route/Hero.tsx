import Image from "next/image";
import Link from "next/link";
import React, {FC} from "react";
import { BiSearch } from "react-icons/bi";

type Props = {};

const Hero: React.FC<Props> = (props) => {
    return (
        <div className="w-full h-[80vh] relative">
            <Image 
                src="/class.jpg"
                alt="Hero Image"
                fill
                className="object-cover"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex flex-col items-center justify-center text-center text-white p-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Hennigan Irish Dance School</h1>
                <p className="text-lg md:text-xl mb-6">Discover the joy of Irish dance with us!</p>
                <Link href="/classes" className="bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded transition duration-300">
                    View Classes
                </Link>
            </div>
        </div>
    );
};

export default Hero;