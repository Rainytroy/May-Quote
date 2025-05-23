export const ORIGINAL_SECOND_STAGE_TEMPLATE = `根据用户的输入："{#input}"，以及ai根据用户输入的初步设计的json文件："{#promptResults1}"，特别注意如果用户要求了promptBlock数量，要补全json中的promptBlock的数量并开发合适的提示词，满足用户对promptBlocks数量的要求（如果有），优化其他promptBlock中的提示词：因为 inputB1-N 是用户一次性输入的，因此 promptBlock1-N 都可以随时用占位符抓取到，应该用最优策略来写 promptBlock，除非客户有明确要求外，一般都要在 1 个 promptBlock 解决问题。而ai对每个promptblock的回答最多4000字左右，当判断客户需要的输出（比如长文章）时，则用多个promptBlock来多次分段输出，因此promptBlock2-n中必须包含至少1个promptBlock占位符和其内容说明，来保持上下文。 json文件本质是一个问卷，用户会输入 inputB1-N，<def></def>标签里面代表该输入的默认值。然后点击提交后，程序会顺序调用 promptBlock1-N中的字符串给到 ai，并依次把内容返回给用户。需要你优化promptBlock中的提示词：1，确保promptBlock1中的提示词引用了正确的用户输入{#inputBn}（但写提示词的时候不要把inputBn中<def>标签中的内容写进来，否则会跟inputBn内容冲突），确保后续的提示词正确地引用了它前面的上下文{#promptBlockn}或者用户的输入（如果需要），n为1-n的整数，代表了控件的编号，每个promptblock至少要有1个{}占位符，不管是input还是promptblock。以下是一个多 promptBlock 范例 
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
