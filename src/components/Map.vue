<template>
  <div class="container" @dblclick="revertMap">
    <div class="chart" ref="map_chart"></div>
  </div>
</template>

<script>
import axios from "axios";
import { getProvinceMapInfo } from "@/utils/map_utils";
import { mapState } from "vuex";

export default {
  data() {
    return {
      chartInstance: null,
      allData: null, //从服务器获取的所有数据
      mapData: {}, //获取省份地图矢量数据的缓存
    };
  },
  created() {
    //在组件创建成功后，进行回调函数的注册
    this.$socket.registerCallBack("mapData", this.getData);
  },
  mounted() {
    this.initChart(); //参数图表
    // this.getData(); //获取数据
    this.$socket.send({
      action: "getData",
      socketType: "mapData",
      chartName: "map",
      value: "",
    });
    window.addEventListener("resize", this.screenAdapter);
    this.screenAdapter(); //第一次主动调用屏幕适配
  },
  destroyed() {
    window.removeEventListener("resize", this.screenAdapter); //组件卸载后取消监听
    this.$socket.unRegisterCallBack("mapData");
  },
  components: {},

  methods: {
    async initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.map_chart,this.theme );
      //获取中国矢量地图数据
      //http://localhost:8099/static/map/china.json
      //由于现在获取的地图矢量数据不是在koa后台，所有不能使用this.$axios(因为在main.js配置了默认请求url)
      // let res = await fetch('http://localhost:8099/static/map/china.json'); //使用fetch,不用引入axios
      // res = await res.json()
      const res = await axios.get(
        "http://localhost:8099/static/map/china.json"
      );
      // console.log(res)
      this.$echarts.registerMap("chinaMap", res.data);
      //第二个参数是包含UTF8Encoding,features,type的对象。使用axios需要.data,fetch直接使用res
      const initOption = {
        title: {
          text: "▎ 商家分布",
          left: 20,
          top: 20,
        },
        geo: {
          type: "map",
          map: "chinaMap",
          top: "5%",
          bottom: "5%",
          itemStyle: {
            //地图区域颜色（这里相当于地图背景颜色）
            areaColor: "#2e72bf",
            borderColor: "#333",
          },
          emphasis: {
            //高亮状态
            itemStyle: {
              //高亮状态区域样式
              areaColor: "pink",
            },
          },
        },
        legend: {
          //图例组件
          left: "5%",
          bottom: "5%",
          orient: "vertical", //图例竖直方向
        },
      };
      this.chartInstance.setOption(initOption);
      this.chartInstance.on("click", async (e) => {
        //e.name 得到的省份，这个省份数据是中文
        // console.log(e)

        const provinceInfo = getProvinceMapInfo(e.name);
        // console.log(provinceInfo)
        //需要获取这个省份的地图矢量数据
        //判断当前所点击的省份矢量数据在mapData中是否存在
        // console.log(this.chartInstance)
        console.log(this.chartInstance.getOption().geo[0].map);
        if (!this.mapData[provinceInfo.key]) {
          // console.log('省份数据不存在，请求数据')
          if (this.chartInstance.getOption().geo[0].map !== "chinaMap") {
            //点击省份地图时不请求数据
            console.log("点击省份不请求数据");
            return;
          }
          const res = await axios.get(
            "http://localhost:8099" + provinceInfo.path
          );
          this.mapData[provinceInfo.key] = res.data;
          // console.log(this.mapData)
          // console.log(res)
          this.$echarts.registerMap(provinceInfo.key, res.data);
        }
        const changeOption = {
          geo: {
            map: provinceInfo.key,
          },
        };
        this.chartInstance.setOption(changeOption);
      });
    },
    async getData(data) {
      //获取服务器数据，对allData进行赋值，调用updateChart方法更新图表
      // const { data } = await this.$axios.get("map");
      // console.log(data)
      this.allData = data;
      this.updateChart(); //获取到数据，更新图表
    },
    updateChart() {
      //处理数据
      const legendArr = this.allData.map((item) => item.name);
      // console.log(legendArr)
      const seriesArr = this.allData.map((item) => {
        //return 的这个对象就代表是一个类别下的所有散点数据
        //如果想在地图中显示散点的数据，使用需要给散点的图表增加配置，coordinateSystem:geo
        return {
          type: "effectScatter",
          rippleEffect: {
            scale: 5, //涟漪范围
            brushType: "stroke", //空心涟漪动画
          },
          name: item.name,
          data: item.children,
          coordinateSystem: "geo",
        };
      });
      // console.log(seriesArr)
      const dataOption = {
        legend: {
          data: legendArr,
        },
        series: seriesArr,
      };
      this.chartInstance.setOption(dataOption);
    },
    screenAdapter() {
      //屏幕适配，如果屏幕改变，图表相关的样式也改变
      const titleFontSize = (this.$refs.map_chart.offsetWidth / 100) * 3.6;
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        legend: {
          itemWidth: titleFontSize / 2,
          itemHeight: titleFontSize / 2,
          itemGap: titleFontSize / 2, //图例中间的间隔
          textStyle: {
            fontSize: titleFontSize / 4, // 图例文字大小
          },
        },
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize(); //帮助图表自动计算外层容器，控制图表自身大小
    },
    revertMap() {
      const option = {
        geo: {
          map: "chinaMap",
        },
      };
      this.chartInstance.setOption(option);
    },
  },
  computed: {
    ...mapState(["theme"]),
  },
  watch: {
    theme() {
      console.log("主题切换");
      this.chartInstance.dispose(); //销毁当前图表
      this.initChart(); //重新以最新主题名称初始化图表对象
      this.screenAdapter(); //完成屏幕适配
      this.updateChart(); //更新图表展示
    },
  },
};
</script>

<style scoped></style>
