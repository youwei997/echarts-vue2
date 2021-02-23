<template>
  <div class="container">
    <div class="chart" ref="stock_chart"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      chartInstance: null,
      allData: null, //从服务器获取的所有数据
      currentIndex: 0, //切换图表
      timerId: null,
      // titleFontSize:null
    };
  },
  created() {
    //在组件创建成功后，进行回调函数的注册
    this.$socket.registerCallBack("stockData", this.getData);
  },
  mounted() {
    this.initChart(); //参数图表
    // this.getData(); //获取数据
    this.$socket.send({
      action: "getData",
      socketType: "stockData",
      chartName: "stock",
      value: "",
    });
    window.addEventListener("resize", this.screenAdapter);
    this.screenAdapter(); //第一次主动调用屏幕适配
  },
  destroyed() {
    window.removeEventListener("resize", this.screenAdapter); //组件卸载后取消监听
    clearInterval(this.timerId);
    this.$socket.unRegisterCallBack("stockData");
  },
  components: {},

  methods: {
    initChart() {
      this.chartInstance = this.$echarts.init(
        this.$refs.stock_chart,
        this.theme
      );
      const initOption = {
        title: {
          text: "▎库存和销量分析",
          textStyle: {},
          left: 20,
          top: 20,
        },
      };
      this.chartInstance.setOption(initOption);
      this.chartInstance.on("mouseover", () => {
        clearInterval(this.timerId);
      });
      this.chartInstance.on("mouseout", () => {
        this.startInterval();
      });
    },
    async getData(data) {
      //对allData进行赋值
      // const { data } = await this.$axios("stock");
      console.log(data);
      this.allData = data;
      this.updateChart(); //获取到数据，更新图表
      this.startInterval();
    },
    updateChart() {
      //处理数据
      const centerArr = [
        ["18%", "40%"],
        ["50%", "40%"],
        ["82%", "40%"],
        ["34%", "75%"],
        ["66%", "75%"],
      ];
      const colorArr = [
        ["#4FF778", "#0BA82C"],
        ["#E5DD45", "#E8B11C"],
        ["#E8821C", "#E55445"],
        ["#5052EE", "#AB6EE5"],
        ["#23E5E5", "#2E72BF"],
      ];
      const start = this.currentIndex * 5;
      const end = (this.currentIndex + 1) * 5;
      const showData = this.allData.slice(start, end);
      // console.log(showData);
      const seriesArr = showData.map((item, index) => {
        return {
          type: "pie",
          // radius: [110, 100],
          center: centerArr[index],
          hoverAnimation: false,
          labelLine: {
            show: false,
          },
          label: {
            position: "center",
            color: colorArr[index][0],
          },
          data: [
            {
              value: item.sales,
              name: item.name + "\n\n" + item.sales,
              itemStyle: {
                color: new this.$echarts.graphic.LinearGradient(0, 1, 0, 0, [
                  {
                    offset: 0,
                    color: colorArr[index][0],
                  },
                  { offset: 0, color: colorArr[index][1] },
                ]),
              },
            },
            {
              value: item.stock,
              name: item.name + "\n" + item.sales,
              itemStyle: {
                color: "#333843",
              },
            },
          ],
        };
      });
      const dataOption = {
        series: seriesArr,
      };
      this.chartInstance.setOption(dataOption);
    },
    screenAdapter() {
      //屏幕适配，如果屏幕改变，图表相关的样式也改变
      const titleFontSize = (this.$refs.stock_chart.offsetWidth / 100) * 3.6;
      const innerRadius = titleFontSize * 3;
      const outterRadius = innerRadius * 1.125;
      // console.log(innerRadius,outterRadius);
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        series: [
          {
            type: "pie",
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 2,
            },
          },
          {
            type: "pie",
            radius: [outterRadius, innerRadius],
            label: {
              fontSize: titleFontSize / 2,
            },
          },
        ],
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
    },
    startInterval() {
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      this.timerId = setInterval(() => {
        this.currentIndex++;
        if (this.currentIndex > 1) {
          this.currentIndex = 0;
        }
        this.updateChart();
      }, 2000);
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
