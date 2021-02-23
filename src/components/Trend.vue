<template>
  <div class="container">
    <div class="title" :style="comStyle">
      <span>{{ "▎ " + showTitle }}</span
      ><span
        class="iconfont icon"
        @click="showChoice = !showChoice"
        :style="comStyle"
        >&#xe6eb;</span
      >
      <div class="con" v-show="showChoice">
        <div
          v-for="item in selectTypes"
          :key="item.key"
          @click="handleSelect(item.key)"
          :style="marginStyle"
        >
          {{ item.text }}
        </div>
      </div>
    </div>
    <div class="chart" ref="trend_chart"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { getThemeValue } from "@/utils/theme_utils";
export default {
  data() {
    return {
      chartInstance: null,
      allData: null, //从服务器获取的所有数据
      showChoice: false, //是否显示可选项
      typeChoice: "map", //显示的数据类型
      titleFontSize: 0, //指明标题字体大小
    };
  },
  created() {
    //在组件创建成功后，进行回调函数的注册
    this.$socket.registerCallBack("trendData", this.getData);
  },
  mounted() {
    this.initChart(); //参数图表
    // this.getData(); //获取数据
    this.$socket.send({
      action: "getData",
      socketType: "trendData",
      chartName: "trend",
      value: "",
    });
    window.addEventListener("resize", this.screenAdapter);
    this.screenAdapter(); //第一次主动调用屏幕适配
  },
  destroyed() {
    window.removeEventListener("resize", this.screenAdapter); //组件卸载后取消监听
    //在组件销毁的时候，进行回调函数的取消
    this.$socket.unRegisterCallBack("trendData");
  },
  computed: {
    ...mapState(["theme"]),
    selectTypes() {
      if (!this.allData) {
        return [];
      }
      return this.allData.type.filter((item) => {
        return item.key !== this.typeChoice;
      });
    },
    showTitle() {
      if (!this.allData) {
        return "";
      }
      return this.allData[this.typeChoice].title;
    },
    comStyle() {
      //设置标题样式
      return {
        fontSize: this.titleFontSize + "px",
        color: getThemeValue(this.theme).titleColor,
      };
    },
    marginStyle() {
      return {
        marginLeft: this.titleFontSize + "px",
      };
    },
  },
  components: {},

  methods: {
    initChart() {
      this.chartInstance = this.$echarts.init(
        this.$refs.trend_chart,
        this.theme
      );
      const initOption = {
        grid: {
          //坐标轴大小设置
          left: "3%",
          top: "35%",
          right: "4%",
          bottom: "1%",
          containLabel: true, //始终显示坐标轴
        },
        tooltip: {
          //工具提示
          trigger: "axis",
        },
        legend: {
          //图例位置和样式
          left: 20,
          top: "15%",
          icon: "circle",
        },
        xAxis: {
          type: "category",
          boundaryGap: false, //紧挨边缘
        },
        yAxis: {
          type: "value",
        },
      };
      this.chartInstance.setOption(initOption);
    },
    //ret 就是服务端发送给客户端的图表数据
    async getData(data) {
      //对allData进行赋值
      // const {data} = await this.$axios.get("trend");

      this.allData = data;
      // console.log(data);
      this.updateChart(); //获取到数据，更新图表
    },
    updateChart() {
      // 半透明的颜色值
      const colorArr1 = [
        "rgba(11, 168, 44, 0.5)",
        "rgba(44, 110, 255, 0.5)",
        "rgba(22, 242, 217, 0.5)",
        "rgba(254, 33, 30, 0.5)",
        "rgba(250, 105, 0, 0.5)",
      ];
      // 全透明的颜色值
      const colorArr2 = [
        "rgba(11, 168, 44, 0)",
        "rgba(44, 110, 255, 0)",
        "rgba(22, 242, 217, 0)",
        "rgba(254, 33, 30, 0)",
        "rgba(250, 105, 0, 0)",
      ];
      //处理数据
      const xArr = this.allData.common.month; //类目轴的数据
      const yArr = this.allData[this.typeChoice].data; //y轴数据，series数据
      const seriesArr = yArr.map((item, index) => {
        return {
          name: item.name,
          type: "line",
          data: item.data,
          stack: "map",
          areaStyle: {
            //区域面积
            color: {
              //颜色渐变
              type: "linear", //设置渐变为线性渐变
              x1: 0,
              y1: 0,
              x2: 0, //从左至右
              y2: 1, //从上至下
              colorStops: [
                {
                  offset: 0,
                  color: colorArr1[index], //0处颜色
                },
                {
                  offset: 1,
                  color: colorArr2[index], //100%的颜色
                },
              ],
            },
          },
        };
      });
      //   console.log(seriesArr);
      const legendArr = yArr.map((item) => item.name);
      const dataOption = {
        legend: {
          data: legendArr,
        },
        xAxis: {
          data: xArr,
        },
        series: seriesArr,
      };
      this.chartInstance.setOption(dataOption);
    },
    screenAdapter() {
      //屏幕适配，如果屏幕改变，图表相关的样式也改变
      this.titleFontSize = (this.$refs.trend_chart.offsetWidth / 100) * 3.6;
      // console.log(this.titleFontSize)
      const adapterOption = {
        legend: {
          itemWidth: this.titleFontSize,
          itemHeight: this.titleFontSize,
          itemGap: this.titleFontSize, //每个图例的间距
          textStyle: {
            fontSize: this.titleFontSize / 2,
          },
        },
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
    },
    handleSelect(currentType) {
      this.typeChoice = currentType;
      this.showChoice = false;
      this.updateChart();
    },
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

<style lang="less" scoped>
.title {
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 1;
  color: white;

  .icon {
    margin-left: 10px;
    cursor: pointer;
  }
  .con {
    background-color: #222733;
  }
}
</style>
