
import Avd_Dec from "../Avd_Dec/Avd_Dec";
import Call_Put from "../Call_Put/Call_Put";
import Chart_Overflow from "../Chart_Overflow/Chart_Overflow";
import Gex_Level from "../Gex_Level/Gex_Level";
import Heat_Map from "../Heat_Map/Heat_Map";
import Velocity_Index from "../Velocity_Index/Velocity_Index";

const ChartMapping = () => {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1 ">
          <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto h-full">
            <Avd_Dec/>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto h-full">
            <Call_Put />
          </div>

          <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto h-full">
            <Heat_Map />
          </div>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 p-1 ">
          <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto h-full">
            <Velocity_Index/>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto h-full">
            <Chart_Overflow/>
          </div>
          
          <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto h-full">
            <Gex_Level/>
          </div>
        </div>
      </div>
    );
  };

export default ChartMapping;
