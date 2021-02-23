<template>
  <div class="container"><div class="chart" ref="rank_chart"></div></div>
</template>
<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      chartInstance: null,
      allData: null, //从服务器获取的所有数据
      startValue: 0, // 区域缩放起点值
      endValue: 9,
      timerId: null, //定时器标识
    };
  },
  created() {
    //在组件创建成功后，进行回调函数的注册
    this.$socket.registerCallBack("rankData", this.getData);
  },
  mounted() {
    this.initChart(); //参数图表
    // this.getData(); //获取数据
    this.$socket.send({
      action: "getData",
      socketType: "rankData",
      chartName: "rank",
      value: "",
    });
    window.addEventListener("resize", this.screenAdapter);
    this.screenAdapter(); //第一次主动调用屏幕适配
  },
  destroyed() {
    window.removeEventListener("resize", this.screenAdapter); //组件卸载后取消监听
    clearInterval(this.timerId);
    this.$socket.unRegisterCallBack("rankData");
  },
  components: {},

  methods: {
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.rank_chart ,this.theme);
      //这个option是初始化写死的数据
      const initOption = {
        title: {
          text: "▎ 地区销售排行",
          left: 20,
          top: 20,
        },
        grid: {
          top: "40%",
          left: "5%",
          right: "5%",
          bottom: "5%",
          containLabel: true,
        },
        tooltip: {
          show: true,
        },
        xAxis: {
          type: "category",
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            type: "bar",
          },
        ],
      };
      this.chartInstance.setOption(initOption);
      this.chartInstance.on("mouseover", () => {
        clearInterval(this.timerId);
      });
      this.chartInstance.on("mouseout", () => {
        this.startInterVal();
      });
    },
    async getData(data) {
      //对allData进行赋值
      //   const { data } = await this.$axios.get("rank");
      // console.log(data)
      this.allData = data.sort((a, b) => {
        return b.value - a.value; // 从大到小进行排序
      });
      this.updateChart(); //获取到数据，更新图表
      this.startInterVal(); //数据更新后启动定时器，使图表进行平移
    },
    updateChart() {
      const colorArr = [
        ["#0BA82C", "#4FF778"],
        ["#2E72BF", "#23E5E5"],
        ["#5052EE", "#AB6EE5"],
      ];
      //处理数据
      const provinceArr = this.allData.map((item) => item.name);
      const seriesArr = this.allData.map((item) => item.value);

      // console.log(provinceArr)
      //这个option是动态的数据
      const dataOption = {
        xAxis: {
          data: provinceArr,
        },
        dataZoom: {
          show: false,
          startValue: this.startValue,
          endValue: this.endValue,
        },
        series: [
          {
            data: seriesArr,
            itemStyle: {
              color: (arg) => {
                let targetColorArr = null;
                if (arg.value > 200) {
                  targetColorArr = colorArr[0];
                } else if (arg.value > 100) {
                  targetColorArr = colorArr[1];
                } else {
                  targetColorArr = colorArr[2];
                }
                return new this.$echarts.graphic.LinearGradient(
                  0,
                  0,
                  0,
                  1, //4个参数用于配置渐变色的起止位置, 这4个参数依次对应右/下/左/上四个方位. 而0 0 0 1则代表渐变色从正上方开始
                  [
                    { offset: 0, color: targetColorArr[0] },
                    { offset: 1, color: targetColorArr[1] },
                  ] //数组, 用于配置颜色的渐变过程. 每一项为一个对象, 包含offset和color两个参数. offset的范围是0 ~ 1, 用于表示位置
                );
              },
            },
          },
        ],
      };
      this.chartInstance.setOption(dataOption);
    },
    screenAdapter() {
      //屏幕适配，如果屏幕改变，图表相关的样式也改变
      const titleFontSize = (this.$refs.rank_chart.offsetWidth / 100) * 3.6;

      //这个option是屏幕适配的数据
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        series: [
          {
            barWidth: titleFontSize,
            itemStyle: {
              borderRadius: [titleFontSize / 2, titleFontSize / 2, 0, 0],
            },
          },
        ],
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
    },
    startInterVal() {
      if (this.timerId) {
        clearInterval(this.timerId);
      }
      this.timerId = setInterval(() => {
        this.startValue++;
        this.endValue++;
        // console.log(this.allData.length)
        // console.log(this.endValue)
        if (this.endValue > this.allData.length - 1) {
          // console.log(this.endValue)
          this.startValue = 0;
          this.endValue = 9;
        }
        this.updateChart();
      }, 1000);
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
