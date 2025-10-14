import Navbar from "../../../components/layout/Navbar/Navbar"

import Fno_Khazana from "../Fno_Khazana/Fno_Khazana"

const Layout = () => {
    return (
        <>
            <Navbar />

            {/* <div className="fixed top-16 left-0 w-full z-10">
                <PriceScroll />
            </div> */}

            {/* Adjusted pt-40 to a smaller value that fits your needs */}
            <div>  {/* or use pt-[72px] if you need precise control */}
              <Fno_Khazana/>
            </div>
        </>
    )
}

export default Layout