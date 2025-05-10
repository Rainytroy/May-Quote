/**
 * 神谕 Agent 生成器使用的提示词模板
 */

/**
 * 第一阶段提示词模板 - 用于初步生成JSON配置
 */
export const AGENT_PROMPT_TEMPLATE_1 = `我需要根据用户的输入："{#input}"。来输出 json，这个 json 是一个问卷，用户会输入 inputB1-N，然后点击提交后，顺序调用 promptBlocks 数组中的字符串给到 ai，并依次把内容返回给用户。需要你帮我把要问用户的所有问题都写到 inputBn 中，而在 promptBlock 中不准问问题，以用户在 inputBn 的<def></def>标签中的内容，作为构建生成解决方案或者回答的promptBlock的输入，用1个或多个promptBlock来形成深度的回答。根据用户要求需要几个promptBlock来设计需要几个promptBlock以及每次的 promptBlock 中的提示词内容的前后逻辑通过添加{#promptBlockn}占位符引用上下文来保持一致，输出的时候输出 json，按照以下的范例和规则输出。

你根据用户输入，认为他最可能的想达成什么目的。然后 inputB1-BN 是你分析要达成这个目的，还需要向用户澄清的 1-3 个关键输入因素（参数），<def></def>默认值中填入"用户看到该inputBn 内容后最可能填入的选项内容， 如 "inputB1": "文章主题 <def>关于技术发展的趋势</def>"，关于技术发展的趋势就是用户看到"文章主题"后最可能填入的选项内容" 

然后判断用户最终需要的是很长的回复，还是简短的回复。如果是长的回复，可能需要多个 promtBlock，如果是短回复，则一个 promptBlock 即可，因为 inputB1-N 是用户一次性输入的，因此 promptBlock1-N 都可以随时用占位符抓取到，应该用最优策略来写 promptBlock，也就是除非是要求写大量复杂文章，一般都要在 1 个 promptBlock 解决问题。第 2-N 个 promptBlock 中必须要引用至少 1 个其前面的 promptBlock。写 promptBlock1 的时候，用户就已经完成了 inputB1-N 的输入，不需要在 promptBlock 中追问用户。promptBlock1 的典型写法为："以下是基本信息：" 写法见下方。

只输出 json 文件，不要输出其他不相关内容。

以下是范例：
用户输入：你最喜欢什么动物 
ai 经过分析，让用户输入三种动物，默认值在<def></def>中，然后调用两次 ai，第一次调用的 prompt 为："以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 猫 狗 鸡"
第二次调用的 prompt 为 "你最喜欢哪个：波斯猫 拉布拉多 白来航鸡？直接输出结果，不需要解释"
（第二次调用中的波斯猫 拉布拉多 白来航鸡为第一次 prompt 生成的结果）

特别说明：Json 文件中的 "promptBlocks": [string1,string2....] 是一个数组，这个数组的每一个元素的名称对应 promptBlock1-N，因此当某个 promptBlock 中出现如 {#promptBlock1} 这样的占位符，该占位符会被替换为 promptBlock1 里面的 prompt 在发给 ai 后得到的回复。这个功能类似大模型中的叠加历史对话上下文的做法，只是更具选择性。因此在构建多个 promptBlock 的 json 文件的时候，每个 promptblock 中必须出现至少 1 种占位符以精准选择需要的上下文，因为数列中的 prompts 每个都是单独的对话发给大模型，是没有上下文的。写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突。

Json 文件范例如下：
多 promptBlock 范例 
 {
 "adminInputs": {
 "inputB1": " 动物 1 <def>猫</def>",
"inputB2":" 动物 2 <def>狗</def>",
"inputB3":" 动物 3 <def>鸡</def>"
 },
"promptBlocks": {
"promptBlock1":" 以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 {#inputB1} {#inputB2} {#inputB3}",
"promptBlock2":" 你最喜欢哪个：{#promptBlock1} 直接输出结果，不需要解释 "
 }
}`;

/**
 * 第二阶段提示词模板 - 用于优化JSON配置
 */
export const AGENT_PROMPT_TEMPLATE_2 = `根据用户的输入："{#input}"，以及ai根据用户输入的初步设计的json文件："{#promptResults1}"，特别注意如果用户要求了promptBlock数量，要补全json中的promptBlock的数量并开发合适的提示词，满足用户对promptBlocks数量的要求（如果有），优化其他promptBlock中的提示词：因为 inputB1-N 是用户一次性输入的，因此 promptBlock1-N 都可以随时用占位符抓取到，应该用最优策略来写 promptBlock，除非客户有明确要求外，一般都要在 1 个 promptBlock 解决问题。而ai对每个promptblock的回答最多4000字左右，当判断客户需要的输出（比如长文章）时，则用多个promptBlock来多次分段输出，因此promptBlock2-n中必须包含至少1个promptBlock占位符和其内容说明，来保持上下文。 json文件本质是一个问卷，用户会输入 inputB1-N，<def></def>标签里面代表该输入的默认值。然后点击提交后，程序会顺序调用 promptBlock1-N中的字符串给到 ai，并依次把内容返回给用户。需要你优化promptBlock中的提示词：1，确保promptBlock1中的提示词引用了正确的用户输入{#inputBn}（但写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突），确保后续的提示词正确地引用了它前面的上下文{#promptBlockn}或者用户的输入（如果需要），n为1-n的整数，代表了控件的编号，每个promptblock至少要有1个{}占位符，不管是input还是promptblock。以下是一个多 promptBlock 范例 
 {
 "adminInputs": {
 "inputB1": " 动物 1 <def>猫</def>",
"inputB2":" 动物 2 <def>狗</def>",
"inputB3":" 动物 3 <def>鸡</def>"
 },
"promptBlocks": {
"promptBlock1":" 以下动物各列一个品种，只输出品种名称，不输出其他不相关的信息。 {#inputB1} {#inputB2} {#inputB3}",
"promptBlock2":" 你最喜欢哪个：{#promptBlock1} 直接输出结果，不需要解释 "
 }
}。多段文章上下文引用范例：{   "adminInputs": {     "inputB1": "文章主题 <def>关于技术发展的趋势</def>",     "inputB2": "每段的主要内容 <def>第一段介绍背景，第二段分析现状，第三段探讨影响，第四段预测未来，第五段总结</def>",     "inputB3": "文章风格 <def>正式且学术</def>",     "inputB4": "目标读者 <def>专业人士</def>",     "inputB5": "是否需要引用数据或案例 <def>是，需要最新的数据和相关案例</def>"   },   "promptBlocks": {     "promptBlock1": "根据提供的基本信息，生成第一段内容，主要介绍技术发展的趋势背景。主题：{#inputB1}，每段内容：{#inputB2}，风格：{#inputB3}，目标读者：{#inputB4}，数据引用：{#inputB5}",     "promptBlock2": "以下是第一段内容：{#promptBlock1}\\n\\n根据第一段内容和基本信息，生成第二段内容，主要分析技术发展的现状。",     "promptBlock3": "以下是前两段内容：{#promptBlock1}\\n{#promptBlock2}\\n\\n根据前两段内容和基本信息，生成第三段内容，主要探讨技术发展的影响。",     "promptBlock4": "以下是前三段内容：{#promptBlock1}\\n{#promptBlock2}\\n{#promptBlock3}\\n\\n根据前三段内容和基本信息，生成第四段内容，主要预测技术发展的未来趋势。",     "promptBlock5": "以下是前四段内容：{#promptBlock1}\\n{#promptBlock2}\\n{#promptBlock3}\\n{#promptBlock4}\\n\\n根据前四段内容和基本信息，生成第五段内容，总结全文并给出结论。"   } }。检查输出的每个promptblock至少要有1个{}占位符，写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突。不管是input还是promptblock直接输出1个最终优化好的JSON文件，不要输出任何其他内容如说明和解释`;

/**
 * 获取默认的第一阶段提示词模板
 */
export function getDefaultFirstStagePrompt(): string {
  return AGENT_PROMPT_TEMPLATE_1;
}

/**
 * 获取默认的第二阶段提示词模板
 */
export function getDefaultSecondStagePrompt(): string {
  return AGENT_PROMPT_TEMPLATE_2;
}
