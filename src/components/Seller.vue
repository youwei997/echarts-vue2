/*商家销量统计的横向柱状图 */

<template>
  <div class="container">
    <div class="chart" ref="seller_chart"></div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  data() {
    return {
      chartInstance: null,
      allData: null, //服务器返回的数据
      currentPage: 1, //   当前显示页数
      totalPage: 0, //一共几页
      timerId: null, //定时器id，用于清除定时器
    };
  },
  created() {
    //在组件创建成功后，进行回调函数的注册
    this.$socket.registerCallBack("sellerData", this.getData);
  },
  mounted() {
    this.initChart();
    // this.getData();
    this.$socket.send({
      action: "getData",
      socketType: "sellerData",
      chartName: "seller",
      value: "",
    });
    this.screenAdapter(); //页面加载完，主动进行屏幕适配

    window.addEventListener("resize", this.screenAdapter);
  },

  destroyed() {
    //组件销毁时，清空定时器
    // console.log("组件销毁时，清空定时器");
    clearInterval(this.timerId);
    window.removeEventListener("resize", this.screenAdapter); //组件销毁时，取消监听
    this.$socket.unRegisterCallBack("sellerData");
  },
  methods: {
    //初始化echartInstance对象
    initChart() {
      this.chartInstance = this.$echarts.init(
        this.$refs.seller_chart,
        this.theme
      );
      const initOption = {
        title: {
          text: "▎商家销售统计",
          textStyle: {},
          left: 20,
          top: 20,
        },
        grid: {
          top: "20%",
          left: "3%",
          right: "6%",
          bottom: "3%",
          containLabel: true, //grid距离包含坐标轴label（默认不包含）
        },
        xAxis: {
          type: "value",
        },
        yAxis: {
          type: "category",
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "line",
            z: 0,
            lineStyle: {
              type: "solid",
              color: "#2d3443",
            },
          },
        },
        series: [
          {
            type: "bar",
            label: {
              show: true, //柱子数据显示，默认不显示
              position: "right", //label文字在柱子右边显示
              textStyle: {
                color: "pink", //label文字颜色
              },
            },
            itemStyle: {
              barBorderRadius: [0, 33, 33, 0],
              color: new this.$echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: "#5052EE", //0处颜色
                },
                {
                  offset: 1,
                  color: "#AB6EE5", //100%的颜色
                },
              ]),
            },
          },
        ],
      };
      this.chartInstance.setOption(initOption);
      //对图表事件进行鼠标监听
      //鼠标移入图表停止定时器，移出启动定时器
      this.chartInstance.on("mouseover", () => {
        //移入停止
        // console.log("移入停止");
        clearInterval(this.timerId);
      });

      this.chartInstance.on("mouseout", () => {
        //移出启动
        // console.log("移出启动");
        this.startInterval(this.timerId);
      });
    },
    //获取服务器数据
    async getData(data) {
      // let { data} = await this.$axios.get("seller");
      this.allData = data;
      //对数组进行排序
      this.allData.sort((a, b) => {
        return a.value - b.value; //从小到大排序
      });
      //每5个显示一页
      this.totalPage =
        this.allData.length % 5 === 0
          ? this.allData.length / 5
          : this.allData.length / 5 + 1;

      this.updateChart();
      //启动定时器
      this.startInterval();
    },
    //更新图表
    updateChart() {
      const start = (this.currentPage - 1) * 5; //从第几个开始，第一次是第0个开始，currentPage每次加1，所以start每次加5
      const end = this.currentPage * 5; //end结束
      const showData = this.allData.slice(start, end); //slice第一个参数是从第几个开始截取（自身）,第二个是第几个结束（截取到自身前一个，不包含自身）
      const sellerNames = showData.map((v) => v.name);
      const sellerValues = showData.map((v) => v.value);

      //   let arr1 = [],
      //     arr2 = [];
      //   this.allData.forEach((v) => {
      //     arr1.push(v.name);
      //     arr2.push(v.value);
      //   });

      const dataOption = {
        yAxis: {
          data: sellerNames,
        },
        series: [
          {
            data: sellerValues,
          },
        ],
      };
      this.chartInstance.setOption(dataOption);
    },
    startInterval() {
      if (this.timerId) {
        // console.log("启动定时器前检查，存在就清空，然后再开启");
        clearInterval(this.timerId); //如果存在定时器，在启动定时器之前，清空定时器，然后再开启新的定时器
      }
      this.timerId = setInterval(() => {
        this.currentPage++;
        if (this.currentPage > this.totalPage) {
          this.currentPage = 1;
        }
        this.updateChart();
      }, 3000);
    },
    screenAdapter() {
      //屏幕适配,当浏览器大小发生变化时，调用的方法，来完成屏幕适配
      // console.log(this.$refs.seller_chart.offsetWidth);
      const titleFontSize = (this.$refs.seller_chart.offsetWidth / 100) * 3.6;
      //和分辨率相关的配置项
      const adapterOption = {
        title: {
          textStyle: {
            fontSize: titleFontSize,
          },
        },
        tooltip: {
          axisPointer: {
            lineStyle: {
              width: titleFontSize,
            },
          },
        },
        series: [
          {
            barWidth: titleFontSize, //柱子宽度
            itemStyle: {
              barBorderRadius: [0, titleFontSize / 2, titleFontSize / 2, 0],
            },
          },
        ],
      };
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
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

<style lang="less" scoped></style>
