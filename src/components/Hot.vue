<template>
  <div class="container">
    <div class="chart" ref="hot_chart"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      chartInstance: null,
      allData: null, //从服务器获取的所有数据
    };
  },
  mounted() {
    this.initChart(); //参数图表
    this.getData(); //获取数据
    window.addEventListener("resize", this.screenAdapter);
    this.screenAdapter(); //第一次主动调用屏幕适配
  },
  destroyed() {
    window.removeEventListener("resize", this.screenAdapter); //组件卸载后取消监听
  },
  components: {},

  methods: {
    initChart() {
      this.chartInstance = this.$echarts.init(this.$refs.hot_chart);
      const initOption = {};
      this.chartInstance.setOption(initOption);
    },
    async getData() {
      //对allData进行赋值
      this.updateChart(); //获取到数据，更新图表
    },
    updateChart() {
      //处理数据
      const dataOption = {};
      this.chartInstance.setOption(dataOption);
    },
    screenAdapter() {
      //屏幕适配，如果屏幕改变，图表相关的样式也改变
      const adapterOption = {};
      this.chartInstance.setOption(adapterOption);
      this.chartInstance.resize();
    },
  },
};
</script>

<style scoped></style>
