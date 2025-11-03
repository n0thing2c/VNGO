import Logo from "@/assets/LogoVNGO.png";
import Building from "@/assets/Banner.svg"
import {FieldSeparator} from "@/components/ui/field.jsx";

export default function Header() {
    return (
        <div className="w-full bg-neutral-50">
            <div
                className="w-full"
                style={{
                    background: "black"
                    //"linear-gradient(180deg, #347FE2 0%, #59AEF1 50%, #FFFFFF 100%)",
                }}
            >
                <div className="w-full max-w-6xl px-4  h-30 relative">
                    <img
                        src={Logo}
                        alt="VNGO"
                        className="h-30 w-auto absolute top-0 left-0"
                    />
                </div>
            </div>
            <div className="w-full mt-15">
                <img
                    src={Building}
                    alt="banner"
                    className="w-full"
                />
                {/*<hr className="banner-line" style={{backgroundColor: "black", height: "1px", border: "none"}}/>*/}

            </div>
        </div>

    );
}