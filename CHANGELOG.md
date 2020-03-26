# 发布历史

### v2.0.0 / `2020-03-26`
1. 之前的版本addQueryString方法，在不指定analyzer时候，默认使用'ik_smart'，调整为只有指定analyzer才设置该参数（只有这个方法和之前版本不兼容)
    ```js
    //版本更新后 下面的两种实现的效果是一样的
    // v1.0.3版本
    client.utils.addQueryString(should, ['abstract'], '衬衫 白色', 'AND', 5);
    // v2.0.0版本
    client.utils.addQueryString(should, ['abstract'], '衬衫 白色', 'AND', 5, 'ik_smart');
    ```

### v1.0.0 / `2019-11-07`
1. client功能包含了get、search、update、increase、count、deleteMulti、updateMulti、getConstantScore
2. utils功能包含了createBody、addMatchPhrase、addMatch、addQueryString、addRange、addTerms、addTerm

