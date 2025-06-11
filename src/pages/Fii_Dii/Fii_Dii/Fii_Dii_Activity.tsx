import {  useEffect } from 'react';
// import Highcharts from 'highcharts';
// import HighchartsReact from 'highcharts-react-official';
import axios from 'axios';
import InvestmentBarChart from '../../Fii_Dii/Fii_Dii/Fii_Dii_Graph';
// import FIIIndexChart from '../../Fii_Dii/Fii_Dii/Fii_Dii_Fno';

function Fii_Dii_Activity() {
  // const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://www.upholictech.com/api/fii-dii-data');
        // setData(response.data);
        console.log(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // const categories = data.map((item) => item['Date']);
  // const fiiNetData = data.map((item) => Number(item['FII Net Purchase/Sales']) || 0);
  // const diiNetData = data.map((item) => Number(item['DII Net Purchase/Sales']) || 0);

  // const options = {
  //   chart: {
  //     type: 'line',
  //   },
  //   title: {
  //     text: 'FII and DII Net Purchase/Sales (Month-wise)',
  //   },
  //   xAxis: {
  //     categories: categories,
  //     title: {
  //       text: 'Date',
  //     },
  //   },
  //   yAxis: {
  //     title: {
  //       text: 'Net Purchase/Sales (in Crores)',
  //     },
  //   },
  //   series: [
  //     {
  //       name: 'FII Net Purchase/Sales',
  //       data: fiiNetData,
  //       color: '#007bff',
  //     },
  //     {
  //       name: 'DII Net Purchase/Sales',
  //       data: diiNetData,
  //       color: '#ff5722',
  //     },
  //   ],
  // };

  return (
    <div className="user-outer-home">
      {/* Additional Charts */}
      <InvestmentBarChart />
      <br />
      {/* <FIIIndexChart /> */}
    </div>
  );
}

export default Fii_Dii_Activity;
