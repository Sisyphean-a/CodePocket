<template>
  <div class="h-screen flex flex-col p-2 bg-gray-50">
    <div class="mb-4">
      <el-button type="primary" class="w-full" @click="createNew">
        New Snippet
      </el-button>
    </div>
    
    <div class="flex-1 overflow-auto">
      <el-card v-for="snippet in snippets" :key="snippet.id" class="mb-2 cursor-pointer" @click="openSnippet(snippet)">
        <div slot="header" class="flex justify-between items-center">
          <span class="font-bold">{{ snippet.title || 'Untitled' }}</span>
        </div>
        <div class="text-xs text-gray-500 truncate">
          {{ snippet.uuid }}
        </div>
      </el-card>
    </div>

    <!-- Editor Dialog -->
    <el-dialog v-model="editorVisible" :title="currentSnippet.title" fullscreen class="editor-dialog">
      <div class="flex flex-col h-full">
        <div class="mb-2 flex gap-2">
            <el-input v-model="currentSnippet.title" placeholder="Title" />
            <el-button type="success" @click="runCode">Run</el-button>
            <el-button type="primary" @click="saveSnippet">Save</el-button>
        </div>
        <codemirror
            v-model="currentSnippet.content"
            placeholder="Code goes here..."
            :style="{ height: '100%', width: '100%', fontSize: '14px' }"
            :autofocus="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="extensions"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, shallowRef } from 'vue'
import { db } from '@/logic/storage'
import { runSnippet as executeSnippet } from '@/logic/runner'
import { Codemirror } from 'vue-codemirror'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { ElMessage } from 'element-plus'

const snippets = ref([])
const editorVisible = ref(false)
const currentSnippet = ref({ uuid: '', title: '', content: '' })

// CodeMirror extensions
const extensions = [html(), oneDark]

// Editor view configuration
const viewConfig = {
    extensions: extensions
}

const loadSnippets = async () => {
  snippets.value = await db.snippets.toArray()
}

const createNew = () => {
  currentSnippet.value = {
    uuid: crypto.randomUUID(),
    title: 'New Tool',
    content: '<h1>Hello World</h1>',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  editorVisible.value = true
}

const openSnippet = (snippet) => {
  currentSnippet.value = { ...snippet }
  editorVisible.value = true
}

const saveSnippet = async () => {
  try {
    // Content is already up-to-date via v-model
    const plainSnippet = JSON.parse(JSON.stringify(currentSnippet.value))
    
    if (plainSnippet.id) {
      await db.snippets.update(plainSnippet.id, plainSnippet)
    } else {
      delete plainSnippet.id 
      await db.snippets.add(plainSnippet)
    }
    await loadSnippets()
    ElMessage.success('Saved successfully!')
  } catch (err) {
    console.error(err)
    ElMessage.error('Failed to save: ' + err.message)
  }
}

const runCode = () => {
  try {
    executeSnippet(currentSnippet.value.content)
  } catch (err) {
    console.error(err)
    ElMessage.error('Failed to run: ' + err.message)
  }
}

onMounted(loadSnippets)


</script>

<style scoped>
</style>
