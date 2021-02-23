<template>
  <div class="container">
    <div class="chart" ref="hot_chart"></div>
    <i class="iconfont left" @click="toLeft" :style="comStyle">&#xe6ef;</i>
    <i class="iconfont right" @click="toRight" :style="comStyle">&#xe6ed;</i>
    <span class="cat-name" :style="comStyle">{{ catName }}</span>
  </div>
</template>

<script>
import { mapState } from "vuex";
import {getThemeValue} from "@/utils/theme_utils";
export default {
  data() {
    return {
      chartInstance: null,
      allData: null, //从服务器获取的所有数据
      chartIndex: 0, //当前展示图表下标，第一次显示第0个图表，左右箭头切换
      titleFontSize: 0,
    };
  },
  computed: {
    ...mapState(["theme"]),
    catName() {
      if (!this.allData) {
        return "";
      }
      return this.allData[this.chartIndex].name;
    },
    comStyle() {
      return {
        fontSize: this.titleFontSize + "px",
        color:getThemeValue(this.theme).titleColor
      };
    },
  },
  created() {
    //在组件创建成功后，进行回调函数的注册
    this.$socket.registerCallBack("hotData", this.getData);
  },
  mounted() {
    this.initChart(); //参数图表
    // this.getData(); //获取数据
    this.$socket.send({
      action: "getData",
      socketType: "hotData",
      chartName: "hotproduct",
      value: "",
    });
    window.addEventListener("resize", this.screenAdapter);
    this.screenAdapter(); //第一次主动调用屏幕适配
  },
  destroyed() {
    window.removeEventListener("resize", this.screenAdapter); //组件卸载后取消监听
    this.$socket.unRegisterCallBack("hotData");
  },
  components: {},

  methods: {
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.hot_chart, this.theme);
      const initOption = {
        title: {
          text: "▎ 热销商品的占比",
          left: 20,
          top: 20,
        },
        legend: {
          top: "15%",
          icon: "circle",
        },
        tooltip: {
          show: true,
          formatter: (arg) => {
            //这里面是data数据是通过updateChart方法 seriesData里面return 的数据
            const thirdCategory = arg.data.children;

            let total = 0;
            thirdCategory.forEach((item) => {
              total += item.value;
            });
            // console.log(total);
            let str = "";
            thirdCategory.forEach((item) => {
              str += `
                ${item.name}: ${parseInt((item.value / total) * 100) + "%"}
                <br/>
                `;
            });
            return str;
          },
        },
        series: [
          {
            type: "pie",
            label: {
              show: false,
            },
            emphasis: {
              label: {
                show: true,
                color: {}, //echarts5，label文字颜色默认都是灰色，把颜色设置成{}就可以和饼图每个数据的颜色一致
              },
              labelLine: {
                show: false,
              },
            },
          },
        ],
      };
      this.chartInstance.setOption(initOption);
    },
    async getData(data) {
      //对allData进行赋值
      // const { data } = await this.$axios("hotproduct");
      this.allData = data;
      console.log(this.allData);
      this.updateChart(); //获取到数据，更新图表
    },
    updateChart() {
      //处理数据
      const legendData = this.allData[this.chartIndex].children.map(
        (item) => item.name
      );
      const seriesData = this.allData[this.chartIndex].children.map((item) => {
        return {
          name: item.name,
          value: item.value,
          children: item.children,
        };
      });
      const dataOption = {
        legend: {
          text: legendData,
        },
        series: [
          {
            data: seriesData,
          },
        ],
      };
      this.chartInstance.setOption(dataOption);
    },
    screenAdapter() {
      this.titleFontSize = (this.$refs.hot_chart.offsetWidth / 100) * 3.6;
      //屏幕适配，如果屏幕改变，图表相关的样式也改变
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: this.titleFontSize,
          },
        },
        legend: {
          itemWidth: this.titleFontSize,
          itemHeight: this.titleFontSize,
          itemGap: this.titleFontSize / 2,
          textStyle: {
            fontSize: this.titleFontSize / 2,
          },
        },
        series: [
          {
            radius: this.titleFontSize * 4.5,
            center: ["50%", "50%"],
          },
        ],
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
    },
    toLeft() {
      this.chartIndex--;
      //   console.log(this.chartIndex);
      if (this.chartIndex < 0) {
        this.chartIndex = this.allData.length - 1;
        //   console.log(this.chartIndex);
      }
      this.updateChart();
    },
    toRight() {
      this.chartIndex++;
      if (this.chartIndex > this.allData.length - 1) {
        this.chartIndex = 0;
      }
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
.container {
  > i,
  span {
    color: white;
  }
  i {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
  }
  .left {
    left: 10%;
  }
  .right {
    right: 10%;
  }
  .cat-name {
    position: absolute;
    right: 20%;
    bottom: 20px;
  }
}
</style>
