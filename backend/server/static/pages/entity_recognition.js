import Vue from 'vue';
import vueDebounce from 'vue-debounce';
import EntityRecognition from '../components/entity_recognition.vue';

Vue.use(vueDebounce);
Vue.use(require('vue-shortkey'), {
  prevent: ['input', 'textarea'],
});

new Vue({
  el: '#mail-app',

  components: { EntityRecognition },

  template: '<EntityRecognition />',
});
