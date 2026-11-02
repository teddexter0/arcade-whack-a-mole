// A deliberately small expression interpreter, not eval. This lets learners run
// arithmetic/boolean expressions without access to DOM, network or app storage.
export function expression(source, context) {
  const tokens=source.match(/\s*(===|!==|>=|<=|&&|\|\||==|!=|[A-Za-z_]\w*|\d+(?:\.\d+)?|[+\-*/%()<>!?:])/g)?.map(t=>t.trim())||[];
  if(tokens.join('')!==source.replace(/\s/g,''))throw Error('Use numbers, named variables, parentheses and arithmetic / boolean operators.');
  let i=0;const precedence={'||':1,'&&':2,'===':3,'!==':3,'==':3,'!=':3,'>':4,'<':4,'>=':4,'<=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
  function atom(){const token=tokens[i++];if(token==='('){const n=parse(0);if(tokens[i++]!==')')throw Error('Missing closing parenthesis.');return n;}if(token==='!')return !atom();if(token==='-')return -atom();if(token==='true')return true;if(token==='false')return false;if(token&&/^\d/.test(token))return Number(token);if(Object.hasOwn(context,token))return context[token];throw Error('Unknown variable: '+token);}
  function parse(min){let left=atom();while(i<tokens.length&&precedence[tokens[i]]>=min){const op=tokens[i++],right=parse(precedence[op]+1);left=({'||':()=>left||right,'&&':()=>left&&right,'===':()=>left===right,'!==':()=>left!==right,'==':()=>left==right,'!=':()=>left!=right,'>':()=>left>right,'<':()=>left<right,'>=':()=>left>=right,'<=':()=>left<=right,'+':()=>left+right,'-':()=>left-right,'*':()=>left*right,'/':()=>left/right,'%':()=>left%right}[op])();}if(min===0&&tokens[i]==='?'){i++;const yes=parse(0);if(tokens[i++]!==':')throw Error('A ternary needs :');const no=parse(0);left=left?yes:no;}return left;}
  if(!tokens.length)throw Error('Write an expression first.');const result=parse(0);if(i!==tokens.length)throw Error('Unexpected token: '+tokens[i]);return result;
}
