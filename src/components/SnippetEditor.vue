<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="border-b-2 border-black p-2 flex justify-between items-center bg-gray-50">
      <div class="flex-1 mr-4">
         <input 
            v-model="localSnippet.title" 
            class="w-full bg-transparent border-b border-black outline-none font-bold placeholder-gray-400"
            placeholder="SNIPPET_TITLE"
         />
      </div>
      <div class="flex gap-2">
         <el-button size="small" @click="$emit('back')">BACK</el-button>
         <el-button type="success" size="small" @click="handleRun">RUN</el-button>
         <el-button type="primary" size="small" @click="handleSave">SAVE</el-button>
      </div>
    </div>

    <!-- Metadata Bar -->
    <div class="flex items-center gap-2 p-2 border-b-2 border-black text-xs bg-white">
        <span class="font-bold">TAGS:</span>
        <input 
            v-model="tagsInput"
            @blur="updateTags"
            class="flex-1 outline-none border-b border-gray-300 focus:border-black font-mono"
            placeholder="comma, separated, tags"
        />
        <span class="font-bold border-l-2 border-black pl-2">UUID:</span> {{ localSnippet.uuid.substring(0,8) }}
        <button class="text-red-600 hover:bg-red-50 px-2 border border-transparent hover:border-red-600 ml-2" @click="$emit('delete', localSnippet)">
            [DELETE]
        </button>
    </div>

    <!-- Editor Area -->
    <div class="flex-1 overflow-hidden relative">
      <codemirror
        v-model="localSnippet.content"
        placeholder="// Code goes here..."
        :style="{ height: '100%', width: '100%', fontSize: '14px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { html } from '@codemirror/lang-html'

const props = defineProps({
  snippet: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:snippet', 'back', 'save', 'run', 'delete'])

const localSnippet = ref({ ...props.snippet })
const tagsInput = ref('')

// Initialize tags input
if (localSnippet.value.tags) {
    tagsInput.value = localSnippet.value.tags.join(', ')
}

const updateTags = () => {
    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t)
    localSnippet.value.tags = tags
    emit('update:snippet', localSnippet.value)
    // Auto save on blur or just update local? 
    // Let's just update local, main save button persists to DB
}

// CodeMirror extensions - using default light theme
const extensions = [html()]

watch(() => props.snippet, (newVal) => {
    localSnippet.value = { ...newVal }
    tagsInput.value = (newVal.tags || []).join(', ')
}, { deep: true })

const handleSave = () => {
    emit('update:snippet', localSnippet.value)
    emit('save', localSnippet.value)
}

const handleRun = () => {
    emit('run', localSnippet.value.content)
}
</script>
