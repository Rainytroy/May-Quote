export const ORIGINAL_FIRST_STAGE_TEMPLATE = `我需要根据用户的输入："{#input}"。来输出 json，这个 json 是一个问卷，用户会输入 inputB1-N，然后点击提交后，顺序调用 promptBlocks 数组中的字符串给到 ai，并依次把内容返回给用户。需要你帮我把要问用户的所有问题都写到 inputBn 中，而在 promptBlock 中不准问问题，以用户在 inputBn 的<def></def>标签中的内容，作为构建生成解决方案或者回答的promptBlock的输入，用1个或多个promptBlock来形成深度的回答。根据用户要求需要几个promptBlock来设计需要几个promptBlock以及每次的 promptBlock 中的提示词内容的前后逻辑通过添加{#promptBlockn}占位符引用上下文来保持一致，输出的时候输出 json，按照以下的范例和规则输出。

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
