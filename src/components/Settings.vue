<template>
  <div class="h-full flex flex-col p-4">
    <div class="font-bold text-xl mb-6 tracking-tighter border-b-2 border-black pb-2">
      SETTINGS_
    </div>

    <div class="space-y-6">
      <!-- GitHub Token -->
      <div class="space-y-2">
        <label class="block font-bold text-xs uppercase tracking-wider">GitHub Personal Access Token</label>
        <div class="text-xs text-gray-500 mb-1">REQUIRED FOR GIST SYNC</div>
        <input 
          v-model="settings.githubToken"
          type="password"
          class="w-full wired-input font-mono text-sm"
          placeholder="ghp_..."
        />
      </div>

      <!-- About -->
      <div class="border-2 border-black p-4 bg-gray-50">
        <div class="font-bold mb-2">[SYSTEM_INFO]</div>
        <div class="text-xs space-y-1 font-mono">
          <div>VERSION: 1.0.0</div>
          <div>BUILD: DIRECT_CONNECT</div>
          <div>MODE: GEEK_WIRE</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-4">
        <el-button type="primary" class="w-full" @click="saveSettings">
          SAVE_CONFIG
        </el-button>
      </div>

      <div class="text-center">
        <el-button @click="$emit('back')" class="w-full border-0 underline">
          BACK_TO_MAIN
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const settings = ref({
  githubToken: ''
})

onMounted(() => {
  const stored = localStorage.getItem('cp_settings')
  if (stored) {
    try {
      settings.value = JSON.parse(stored)
    } catch (e) {}
  }
})

const saveSettings = () => {
  localStorage.setItem('cp_settings', JSON.stringify(settings.value))
  ElMessage.success('CONFIGURATION_SAVED')
}

defineEmits(['back'])
</script>
