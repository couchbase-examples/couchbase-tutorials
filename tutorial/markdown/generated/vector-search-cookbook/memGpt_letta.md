---
# frontmatter
path: "/tutorial-letta-memgpt-agents"
title: Use Couchbase Vector Store with Letta Agents
short_title: Use Couchbase with Letta
description:
  - Learn how to use Letta Agents
  - Upload Couchbase Search Tool to Letta
  - Letta Agents with Couchbase
content_type: tutorial
filter: sdk
technology:
  - vector search
tags:
  - Artificial Intelligence
sdk_language:
  - python
length: 20 Mins
---


<!--- *** WARNING ***: Autogenerated markdown file from jupyter notebook. ***DO NOT EDIT THIS FILE***. Changes should be made to the original notebook file. See commit message for source repo. -->


[View Source](https://github.com/couchbase-examples/vector-search-cookbook/tree/main/memGpt_letta/memGpt_letta.ipynb)

# How to build Agents with Couchbase, LangChain and Letta!

This repository will illustrate the core concepts behind [Letta](https://www.letta.com/), a new startup built from the success of [MemGPT](https://memgpt.ai/) from researchers at UC Berkeley.

Letta helps you build Agents with **meta memory**.

In addition to the prompt sent to an LLM, the LLM will also be provided with a short description of its internal knowledge about the user and their interests derived from previous chats.

There are 3 parts to this notebook:

## 1. Getting Started with Letta Agents

An illustration of the basic setup requirements and a simple example of an Agent with internal memory.

## 2. Upload Couchbase Search Tool to Letta

Wrap Couchbase Vector Search in a Python function and upload it to the Letta Tool server. We will use [LangChain](https://python.langchain.com/docs/integrations/providers/couchbase/) to create function which uses Couchbase Vector Store. This tool focuses on providing RAG capabilities for a particular collection. We can create either multiple such functions, or a single function with collection name passed as parameter to offer varied results based on use case.

## 3. Letta Agent with Couchbase

Construct a Letta Agent that chats with a climate report indexed in Couchbase. Observe how the Letta Agent develops an internal model of the chat user and the climate report through these interactions.

# 1. Getting Started with Letta Agents

### Primer: Install Letta Server

`$pip install -U letta`

Start local server:
(You may need to export OpenAI API Key before running this command for this tutorial to work)

`$letta server`



For more details, checkout ReadMe of the Letta Repo
https://github.com/letta-ai/letta



### Connect to Letta Client

Connect the Letta Server, the default port to run letta client is 8283. This may change based on your configuration.


```python
from letta import create_client 

# connect to the letta server
letta_client = create_client(base_url="http://localhost:8283")


```


```python
# get this from your local GUI
my_letta_agent_id = "agent-ba1cee1d-1f31-4619-8ee2-557eb844a063"

# send a message to the agent
response = letta_client.send_message(
    agent_id=my_letta_agent_id,
    role="user", 
    message="By 2100, what is the projected global warming rise possible if no actions are taken?"
)
```


```python
# Print the internal monologue
print("Internal Monologue:")
print(response.messages[0].internal_monologue)
print()

# Print the message sent
print("Message Sent:")
print(response.messages[1].function_call.arguments)
print()

# Print the function return status
print("Function Return Status:")
print(f"Status: {response.messages[2].status}")
print(f"Time: {response.messages[2].function_return}")
print()

# Print usage statistics
print("Usage Statistics:")
print(f"Completion tokens: {response.usage.completion_tokens}")
print(f"Prompt tokens: {response.usage.prompt_tokens}") 
print(f"Total tokens: {response.usage.total_tokens}")
print(f"Step count: {response.usage.step_count}")
```

    Internal Monologue:
    His concern about global climate trends is apparent. While providing the information, I must stress the gravity and urgency of environmental preservation.
    
    Message Sent:
    {
      "message": "This is indeed an issue of utmost importance, Chad. If no substantial actions are taken to mitigate climate change, scientists predict that global temperatures could increase by more than 4 degrees Celsius by the end of the 21st century compared to pre-industrial levels. However, it's important to note that projections can vary based on different climate models and scenarios. The current consensus underscores the need for immediate and sustained action to limit warming to within manageable levels."
    }
    
    Function Return Status:
    Status: success
    Time: {
      "status": "OK",
      "message": "None",
      "time": "2024-11-15 10:23:55 AM IST+0530"
    }
    
    Usage Statistics:
    Completion tokens: 136
    Prompt tokens: 6199
    Total tokens: 6335
    Step count: 1


# 2. Upload Couchbase Search Tool indexed on Climate Report to Letta

We are using a publically available IPCC Climate Change Report. You may get it from here: https://www.ipcc.ch/report/ar6/syr/downloads/report/IPCC_AR6_SYR_LongerReport.pdf .

To learn how to index a PDF to Couchbase to perform vector search, please follow this tutorial, https://developer.couchbase.com/tutorial-python-langchain-pdf-chat



```python
import os

os.environ["OPENAI_API_KEY"] = "sk-xxxxxxx"
os.environ["CB_CONN_STR"] = "couchbase://localhost"
os.environ["CB_BUCKET"] = "pdf-docs"
os.environ["CB_SCOPE"] = "letta"
os.environ["CB_COLLECTION"] = "climate_report"
os.environ["CB_USERNAME"] = "Administrator"
os.environ["CB_PASSWORD"] = "password"
os.environ["SEARCH_INDEX"] = "climate_index"
```


```python
def ask_climate_search(
    self,
    search_query: str
):
    """
    Search the couchbase database for all the climate related questions from climate report.
    It uses the search engine to find the most relevant results related to climate and impacts.
    All the climate related questions shoukld be asked using this function.

    Args: 
        search_query (str): The search query for the climate related questions.

    Returns: 
        search_results (str): The results from the search engine.
    """
    from couchbase.cluster import Cluster, ClusterOptions
    from couchbase.auth import PasswordAuthenticator
    from datetime import timedelta
    from langchain_openai import OpenAIEmbeddings
    from langchain_couchbase.vectorstores import CouchbaseVectorStore
    import os
    from pydantic import SecretStr


    conn_str = os.getenv("CB_CONN_STR") or "couchbase://localhost"
    bucket_name = os.getenv("CB_BUCKET") or "pdf-docs"
    scope_name = os.getenv("CB_SCOPE") or "letta"
    collection_name = os.getenv("CB_COLLECTION") or "climate_report"
    username = os.getenv("CB_USERNAME") or "Administrator"
    password = os.getenv("CB_PASSWORD") or "password"
    search_index = os.getenv("SEARCH_INDEX") or "climate_index"
    openai_api_key = os.getenv("OPENAI_API_KEY") or "sk-xxxxxxx"

    # Connect to the cluster
    auth = PasswordAuthenticator(username, password)
    options = ClusterOptions(auth)
    cluster = Cluster(conn_str, options)
    cluster.wait_until_ready(timedelta(seconds=5))
    embedding = OpenAIEmbeddings(api_key=SecretStr(openai_api_key))
    cb_vector_store = CouchbaseVectorStore(
        cluster,
        bucket_name,
        scope_name,
        collection_name,
        embedding,
        search_index,
    )

    query_result = cb_vector_store.similarity_search(search_query, 5)
    formatted_results = "\n".join(
        [f"[Search Result {i+1}] {str(result.page_content)}" for i, result in enumerate(query_result)]
    )
    return formatted_results
```


```python
couchbase_search_tool = letta_client.create_tool(
    ask_climate_search,
    tags=["search", "climate", "weather",  "impact"],
)
```


```python
letta_client.list_tools()
```

# 3. Letta Agent with Couchbase


```python
from letta import LLMConfig, EmbeddingConfig
# set default llm config for agents
letta_client.set_default_llm_config(
    LLMConfig.default_config(model_name="gpt-4o-mini")
)

# set default embedding config for agents
letta_client.set_default_embedding_config(
    EmbeddingConfig.default_config(model_name="text-embedding-ada-002")
)

agent_state = letta_client.create_agent(
    name="climate-agent",
    tools=[couchbase_search_tool.name],
)

new_agent_id = agent_state.id
```


```python
response = letta_client.send_message(
    agent_id=new_agent_id,
    role="user",
    message="By 2100, what is the projected global warming rise possible if no actions are taken?"
)

print(response)
```

    {
        "messages": [
            {
                "id": "message-b8555891-125f-4cb6-9f18-b55c0f7ff246",
                "date": "2024-11-15T04:41:41+00:00",
                "message_type": "internal_monologue",
                "internal_monologue": "The user is curious about the implications of climate inaction. I should provide a well-researched answer about global warming projections."
            },
            {
                "id": "message-b8555891-125f-4cb6-9f18-b55c0f7ff246",
                "date": "2024-11-15T04:41:41+00:00",
                "message_type": "function_call",
                "function_call": {
                    "name": "ask_climate_search",
                    "arguments": "{\n  \"search_query\": \"global warming rise by 2100\",\n  \"request_heartbeat\": true\n}",
                    "function_call_id": "call_e9JFmCstpfODePsSUaOf8tZA"
                }
            },
            {
                "id": "message-bf02e7e0-3fe7-4f2e-8bc2-2ce5df10e7d0",
                "date": "2024-11-15T04:41:41+00:00",
                "message_type": "function_return",
                "function_return": "{\n  \"status\": \"OK\",\n  \"message\": \"[Search Result 1] 98\\nSection 4\\nSection 1Section 4\\nGlobal warming will continue to increase in the near term (2021–2040) \\nmainly due to increased cumulative CO 2 emissions in nearly all \\nconsidered scenarios and pathways. In the near term, every \\nregion in the world is projected to face further increases in \\nclimate hazards ( medium to high conﬁdence, depending on \\nregion and hazard), increasing multiple risks to ecosystems \\nand humans ( very high conﬁdence ). In the near term, natural \\nvariability149 will modulate human-caused changes, either attenuating \\nor amplifying projected changes, especially at regional scales, with little \\neffect on centennial global warming. Those modulations are important \\nto consider in adaptation planning. Global surface temperature in any \\nsingle year can vary above or below the long-term human-induced \\ntrend, due to natural variability. By 2030, global surface temperature \\nin any individual year could exceed 1.5°C relative to 1850–1900 with a \\nprobability between 40% and 60%, across the five scenarios assessed \\nin WGI (medium confidence ). The occurrence of individual years with \\nglobal surface temperature change above a certain level does not \\nimply that this global warming level has been reached. If a large \\nexplosive volcanic eruption were to occur in the near term 150 , it \\nwould temporarily and partially mask human-caused climate change \\nby reducing global surface temperature and precipitation, especially\\n[Search Result 2] Global warming will continue to increase in the near term in \\nnearly all considered scenarios and modelled pathways. Deep, \\nrapid, and sustained GHG emissions reductions, reaching net \\nzero CO2 emissions and including strong emissions reductions \\nof other GHGs, in particular CH4, are necessary to limit warming \\nto 1.5°C (>50%) or less  than 2°C (>67%) by the end of century \\n(high conﬁdence ). The best estimate of reaching 1.5°C of global \\nwarming lies in the ﬁrst half  of the 2030s in most of the considered \\nscenarios and modelled pathways114. In the very low GHG emissions \\nscenario ( SSP1-1.9), CO2 emissions reach net zero around 2050 and the \\nbest-estimate end-of-century warming is 1.4°C, after a temporary overshoot \\n(see Section 3.3.4) of no more than 0.1°C above 1.5°C global warming. \\nGlobal warming of 2°C will be exceeded during the 21st century unless \\ndeep reductions in CO2 and other GHG emissions occur in the coming \\ndecades. Deep, rapid, and sustained reductions in GHG emissions would \\nlead to improvements in air quality within a few years, to reductions in \\ntrends of global surface temperature discernible after around 20 years, \\nand over longer time periods for many other climate impact-drivers 115 \\n(high conﬁdence ). Targeted reductions of air pollutant emissions lead \\nto more rapid improvements in air quality compared to reductions \\nin GHG emissions only, but in the long term, further improvements are\\n[Search Result 3] and risks for coastal ecosystems, people and infrastructure will continue \\nto increase beyond 2100 ( high conﬁdence ). At sustained warming \\nlevels between 2°C and 3°C,  the Greenland and West Antarctic ice \\nsheets will be lost almost completely and irreversibly over multiple \\nmillennia (limited evidence). The probability and rate of ice mass loss \\nincrease with higher global surface temperatures ( high conﬁdence ). \\nOver the next 2000 years, global mean sea level will rise by about \\n2 to 3 m if warming is limited to 1.5°C and 2 to 6 m if limited to 2°C \\n(low conﬁdence). Projections of multi-millennial global mean sea level \\nrise are consistent with reconstructed levels during past warm climate \\nperiods: global mean sea level was very likely 5 to 25 m higher than today \\nroughly 3 million years ago, when global temperatures were 2.5°C to \\n4°C higher than 1850–1900 ( medium conﬁdence ). Further examples \\nof unavoidable changes in the climate system due to multi-decadal \\nor longer response timescales include continued glacier melt ( very high \\nconﬁdence) and permafrost carbon loss (high conﬁdence). {WGI SPM B.5.2, \\nWGI SPM B.5.3, WGI SPM B.5.4, WGI SPM C.2.5, WGI Box TS.4, \\nWGI Box TS.9, WGI 9.5.1; WGII TS C.5; SROCC SPM B.3, SROCC SPM B.6, \\nSROCC SPM B.9} (Figure 3.4)\\nThe probability of low- likelihood outcomes associated with \\npotentially very large impacts increases with higher global \\nwarming levels (high conﬁdence). Warming substantially above the\\n[Search Result 4] potentially very large impacts increases with higher global \\nwarming levels (high conﬁdence). Warming substantially above the \\nassessed very likely range for a given scenario cannot be ruled out, and \\nthere is high conﬁdence  this would lead to regional changes greater \\nthan assessed in many aspects of the climate system. Low-likelihood, \\nhigh-impact outcomes could occur at regional scales even for global warming \\nwithin the very likely assessed range for a given GHG emissions scenario. \\nGlobal mean sea level rise above the l i k e l y range – approaching 2 m by \\n2100 and in excess of 15 m by 2300 under a very high GHG emissions \\nscenario (SSP5-8.5) (low confidence ) – cannot be ruled out due to \\ndeep uncertainty in ice-sheet processes 123 and would have severe\\n[Search Result 5] livelihoods, food security, water supply, human security, and economic \\ngrowth are projected to increase with global warming of 1 .5°C. In \\nterrestrial ecosystems, 3 to 14% of the tens of thousands of species \\nassessed will likely face a very high risk of extinction at a GWL of 1.5°C. \\nCoral reefs are projected to decline by a further 70–90% at 1.5°C of \\nglobal warming ( high conﬁdence ). At this  GWL, many low-elevation \\nand small glaciers around the world would lose most of their mass or \\ndisappear within decades to centuries  (high conﬁdence ). Regions at \\ndisproportionately higher risk include Arctic ecosystems, dryland regions, \\nsmall island developing states and Least Developed Countries ( high \\nconﬁdence). {WGII SPM B.3, WGII SPM B.4.1, WGII TS.C.4.2; SR1.5 SPM A... [NOTE: function output was truncated since it exceeded the character limit (6571 > 6000)]\",\n  \"time\": \"2024-11-15 10:11:41 AM IST+0530\"\n}",
                "status": "success",
                "function_call_id": "call_e9JFmCstpfODePsSUaOf8tZA"
            },
            {
                "id": "message-a1f944bf-b739-478f-a765-e4776401d1cf",
                "date": "2024-11-15T04:41:44+00:00",
                "message_type": "internal_monologue",
                "internal_monologue": "I found detailed information about projected global warming. Time to summarize it clearly for Chad."
            },
            {
                "id": "message-a1f944bf-b739-478f-a765-e4776401d1cf",
                "date": "2024-11-15T04:41:44+00:00",
                "message_type": "function_call",
                "function_call": {
                    "name": "send_message",
                    "arguments": "{\n  \"message\": \"If no significant actions are taken, global warming is projected to exceed 2°C above pre-industrial levels by 2100, potentially reaching between 2°C and 4°C in worst-case scenarios. This would lead to severe impacts on ecosystems, sea-level rise, and increased climate-related hazards.\"\n}",
                    "function_call_id": "call_vglAIXtXhneq0u7btRNYrjGo"
                }
            },
            {
                "id": "message-62b9f864-95b8-4ef8-b98d-066bd06fb7e9",
                "date": "2024-11-15T04:41:44+00:00",
                "message_type": "function_return",
                "function_return": "{\n  \"status\": \"OK\",\n  \"message\": \"None\",\n  \"time\": \"2024-11-15 10:11:44 AM IST+0530\"\n}",
                "status": "success",
                "function_call_id": "call_vglAIXtXhneq0u7btRNYrjGo"
            }
        ],
        "usage": {
            "completion_tokens": 154,
            "prompt_tokens": 6708,
            "total_tokens": 6862,
            "step_count": 2
        }
    }



```python
response = letta_client.send_message(
    agent_id=new_agent_id,
    role="user",
    message="Based on the report, Does greenhouse gases emission depend on income level?"
)

print(response)
```

    {
        "messages": [
            {
                "id": "message-225864f8-b60e-4202-b61b-7cd2b88c0a9c",
                "date": "2024-11-15T04:41:45+00:00",
                "message_type": "internal_monologue",
                "internal_monologue": "Chad is asking an insightful question about the relationship between income levels and emissions. I need to find relevant information."
            },
            {
                "id": "message-225864f8-b60e-4202-b61b-7cd2b88c0a9c",
                "date": "2024-11-15T04:41:45+00:00",
                "message_type": "function_call",
                "function_call": {
                    "name": "ask_climate_search",
                    "arguments": "{\n  \"search_query\": \"greenhouse gas emissions and income level\",\n  \"request_heartbeat\": true\n}",
                    "function_call_id": "call_fU0IqHN9balZ2nfgnROyXtAn"
                }
            },
            {
                "id": "message-dda36b14-49b9-485b-865d-a7d5ed8e186f",
                "date": "2024-11-15T04:41:46+00:00",
                "message_type": "function_return",
                "function_return": "{\n  \"status\": \"OK\",\n  \"message\": \"[Search Result 1] processes (CO2-FFI), due to improvements in energy intensity of GDP \\nand carbon intensity of energy, have been less than emissions increases \\nfrom rising global activity levels in industry, energy supply, transport, \\nagriculture and buildings. The 10% of households with the highest per \\ncapita emissions contribute 34– 45% of global consumption-based \\nhousehold GHG emissions, while the middle 40% contribute 40–53%, \\nand the bottom 50% contribute 13–15%. An increasing share of \\nemissions can be attributed to urban areas (a rise from about 62% \\nto 67–72% of the global share between 2015 and 2020). The drivers \\nof urban GHG emissions 73 are complex and include population size ,  \\nincome, state of urbanisation and urban form. ( high conﬁdence ) \\n{WGIII SPM B.2, WGIII SPM B.2.3, WGIII SPM B.3.4, WGIII SPM D.1.1}\\n[Search Result 2] high socio-economic status contribute disproportionately to emissions, \\nand have the highest potential for emissions reductions, e.g., as \\ncitizens, investors, consumers, role models, and professionals ( high \\nconﬁdence). There are options on design of instruments such as taxes, \\nsubsidies, prices, and consumption-based approaches, complemented \\nby regulatory instruments to reduce high-emissions consumption while \\nimproving equity and societal well-being (high conﬁdence). Behaviour \\nand lifestyle changes to help end-users adopt low-GHG-intensive \\noptions can be supported by policies, infrastructure and technology \\nwith multiple co- beneﬁts for societal well-being ( high conﬁdence ). \\nBroadening equitable access to domestic and international ﬁnance, \\ntechnologies and capacity can also act as a catalyst for accelerating \\nmitigation and shifting development pathways in low-income contexts \\n(high conﬁdence ). Eradicating extreme poverty, energy poverty, and \\nproviding decent living standards to all in these regions in the context of \\nachieving sustainable development objectives, in the near term, can be \\nachieved without signiﬁcant global emissions growth (high conﬁdence). \\nTechnology development, transfer, capacity building and ﬁnancing can \\nsupport developing countries/ regions leapfrogging or transitioning to \\nlow-emissions transport systems thereby providing multiple co-beneﬁts \\n(high conﬁdence ). Climate resilient development is advanced when\\n[Search Result 3] over 20% of global GHG emissions were covered by carbon taxes or \\nemissions trading systems, although coverage and prices have been \\ninsufﬁcient to achieve deep reductions (medium conﬁdence). Equity and \\ndistributional impacts of carbon pricing instruments can be addressed \\nby using revenue from carbon taxes or emissions trading to support \\nlow-income households, among other approaches  (high conﬁdence ). \\nThe mix of policy instruments which reduced costs and stimulated \\nadoption of solar energy, wind energy and lithium-ion batteries \\nincludes public R&D, funding for demonstration and pilot projects, and \\ndemand-pull instruments such as deployment subsidies to attain scale \\n(high conﬁdence ) ( Figure 2.4). { WGIII SPM B.4.1, WGIII SPM B.5.2, \\nWGIII SPM E.4.2, WG III TS.3} \\nMitigation actions, supported by policies, have contributed \\nto a decrease in global energy and carbon intensity between \\n2010 and 2019, with a growing number of countries achieving \\nabsolute GHG emission reductions for more than a decade (high \\nconﬁdence). While global net GHG emissions have increased since \\n2010, global energy intensity (total primary energy per unit GDP) \\ndecreased by 2% yr –1 between 2010 and 2019. Global carbon \\nintensity (CO2-FFI per unit primary energy) also decreased by 0.3% \\nyr–1, mainly due to fuel switching from coal to gas, reduced expansion \\nof coal capacity, and increased use of renewables, and with large \\nregional variations over the same period. In many countries, policies\\n[Search Result 4] higher CO2-LULUCF emissions from a forest and peat ﬁre event in South East Asia. Regions are as grouped in Annex II of WGIII. Panel (d) shows population, gross domestic product \\n(GDP) per person, emission indicators by region in 2019 for total GHG per person, and total GHG emissions intensity, together with production-based and consumption-based CO2-FFI data, \\nwhich is assessed in this report up to 2018. Consumption-based emissions are emissions released to the atmosphere in order to generate the goods and services consumed by a \\ncertain entity (e.g., region). Emissions from international aviation and shipping are not included. {WGIII Figure SPM.2}\\n2.1.2. Observed Climate System Changes and Impacts to \\nDate\\nIt is unequivocal that human inﬂuence has warmed the \\natmosphere, ocean and land. Widespread and rapid changes in \\nthe atmosphere, ocean, cryosphere and biosphere have occurred \\n(Table 2.1). The scale of recent changes across the climate system as \\na whole and the present state of many aspects of the climate system \\nare unprecedented over many centuries to many thousands of years. It \\nis very likely that GHG emissions were the main driver74 of tropospheric \\nwarming and extremely likely that human-caused stratospheric ozone \\ndepletion was the main driver of stratospheric cooling between 1979 \\nand the mid-1990s. It is virtually certain that the global upper ocean \\n(0-700m) has warmed since the 1970s and extremely likely  that\\n[Search Result 5] in regional and national per capita emissions partly reﬂect different \\ndevelopment stages, but they also vary widely at similar income \\nlevels. Average per capita net anthropogenic GHG emissions in 2019 \\nranged from 2.6 tCO 2-eq to 19 tCO 2-eq across regions (Figure 2.2). \\nLeast Developed Countries (LDCs) and Small Island Developing States (SIDS) \\nhave much lower per capita emissions (1.7 tCO 2-eq and 4.6 tCO 2-eq, \\nrespectively) than the global average (6.9 tCO 2-eq), excluding \\nCO2-LULUCF . Around 48% of the global population in 2019 lives in countries \\nemitting on average more than 6 tCO2-eq per capita, 35% of the global \\npopulation live in countries emitting mor... [NOTE: function output was truncated since it exceeded the character limit (6717 > 6000)]\",\n  \"time\": \"2024-11-15 10:11:46 AM IST+0530\"\n}",
                "status": "success",
                "function_call_id": "call_fU0IqHN9balZ2nfgnROyXtAn"
            },
            {
                "id": "message-ddda96a6-50d7-4311-95fc-91235550f1ce",
                "date": "2024-11-15T04:41:48+00:00",
                "message_type": "internal_monologue",
                "internal_monologue": "I found relevant data showing the correlation between income levels and emissions. Now I need to convey this clearly."
            },
            {
                "id": "message-ddda96a6-50d7-4311-95fc-91235550f1ce",
                "date": "2024-11-15T04:41:48+00:00",
                "message_type": "function_call",
                "function_call": {
                    "name": "send_message",
                    "arguments": "{\n  \"message\": \"Yes, greenhouse gas emissions do depend on income levels. Wealthier households and regions typically contribute disproportionately to emissions due to higher consumption patterns. In contrast, lower-income areas often exhibit significantly lower emissions, although they may still face the brunt of climate impacts. Policies targeting equity can help reduce emissions while improving living standards.\"\n}",
                    "function_call_id": "call_BZZFO2SA5QGRq0SYJPATywVR"
                }
            },
            {
                "id": "message-66b27339-dd39-4611-8d99-8cf1dc3521d0",
                "date": "2024-11-15T04:41:48+00:00",
                "message_type": "function_return",
                "function_return": "{\n  \"status\": \"OK\",\n  \"message\": \"None\",\n  \"time\": \"2024-11-15 10:11:48 AM IST+0530\"\n}",
                "status": "success",
                "function_call_id": "call_BZZFO2SA5QGRq0SYJPATywVR"
            }
        ],
        "usage": {
            "completion_tokens": 160,
            "prompt_tokens": 10536,
            "total_tokens": 10696,
            "step_count": 2
        }
    }



```python
response = letta_client.send_message(
    agent_id=new_agent_id,
    role="user",
    message="What are some high confidence methods which can help in reversing climate change?"
)

print(response)
```

    {
        "messages": [
            {
                "id": "message-8ccb5cbb-2e22-47a2-86a5-fa10e3554e1e",
                "date": "2024-11-15T04:41:50+00:00",
                "message_type": "internal_monologue",
                "internal_monologue": "Chad is looking for effective methods to combat climate change. I need to gather reliable information about high-confidence strategies."
            },
            {
                "id": "message-8ccb5cbb-2e22-47a2-86a5-fa10e3554e1e",
                "date": "2024-11-15T04:41:50+00:00",
                "message_type": "function_call",
                "function_call": {
                    "name": "ask_climate_search",
                    "arguments": "{\n  \"search_query\": \"methods to reverse climate change\",\n  \"request_heartbeat\": true\n}",
                    "function_call_id": "call_c1XF43X8Aazdaa818uAQlHQw"
                }
            },
            {
                "id": "message-865a92bd-ae87-408f-bfea-3788f74dfba6",
                "date": "2024-11-15T04:41:51+00:00",
                "message_type": "function_return",
                "function_return": "{\n  \"status\": \"OK\",\n  \"message\": \"[Search Result 1] restoration of wetlands and upstream forest ecosystems reduce \\na range of  climate change risks, including ﬂood risks, urban heat \\nand provide multiple co-beneﬁts. Some land-based adaptation \\noptions provide immediate beneﬁts (e.g., conservation of peatlands,\\n[Search Result 2] 107\\nNear-Term Responses in a Changing Climate\\nSection 4\\nImproved access to clean energy sources and technologies, and shifts \\nto active mobility (e.g., walking and cycling) and public transport can \\ndeliver socioeconomic, air quality and health benefits, especially \\nfor women and children ( high confidence ). {WGII SPM C.2.2, WGII \\nSPM C.2.11, WGII Cross-Chapter Box HEALTH; WGIII SPM C.2.2, \\nWGIII SPM C.4.2, WGIII SPM C.9.1, WGIII SPM C.10.4, WGIII SPM \\nD.1.3, WGIII Figure SPM.6, WGIII Figure SPM.8; SRCCL SPM B.6.2, \\nSRCCL SPM B.6.3, SRCCL B.4.6, SRCCL SPM C.2.4 }\\nEffective adaptation options exist to help protect human health \\nand well-being (high conﬁdence ). Health Action Plans that include \\nearly warning and response systems are effective for extreme heat (high \\nconﬁdence). Effective options for water-borne and food-borne diseases \\ninclude improving access to potable water, reducing exposure of water and \\nsanitation systems to ﬂooding and extreme weather events, and improved \\nearly warning systems (very high conﬁdence). For vector-borne diseases, \\neffective adaptation options include surveillance, early warning \\nsystems, and vaccine development ( very high conﬁdence ). Effective \\nadaptation options for reducing mental health risks under climate \\nchange include improving surveillance and access to mental health \\ncare, and monitoring of psychosocial impacts from extreme weather \\nevents ( high conﬁdence ). A key pathway to climate resilience in the\\n[Search Result 3] and ambition of climate governance (medium conﬁdence). Engaging \\nIndigenous Peoples and local communities using just- transition and \\nrights-based decision-making approaches, implemented through \\ncollective and participatory decision-making processes has enabled \\ndeeper ambition and accelerated action in different ways, and at all \\nscales, depending on national circumstances ( medium conﬁdence ). \\nThe media helps shape the public discourse about climate change. This \\ncan usefully build public support to accelerate climate action ( medium \\nevidence, high agreement ). In  s o m e  i n s t a n c e s ,  public discourses of \\nmedia and organised counter movements have impeded climate \\naction, exacerbating helplessness and disinformation and fuelling \\npolarisation, with negative implications for climate action ( medium \\nconﬁdence). {WGII SPM C.5.1, WGII SPM D.2, WGII TS.D.9, WGII TS.D.9.7, \\nWGII TS.E.2.1, WGII 18.4; WGIII SPM D.3.3, WGIII SPM E.3.3, WGIII TS.6.1, \\nWGIII 6.7, WGIII 13 ES, WGIII Box.13.7}\\n2.2.2. Mitigation Actions to Date\\nThere has been a consistent expansion of policies and laws \\naddressing mitigation since AR5  (high conﬁdence ). Climate \\ngovernance supports mitigation by providing frameworks through \\nwhich diverse actors interact, and a basis for policy development and \\nimplementation (medium conﬁdence ). Many regulatory and economic \\ninstruments have already been deployed successfully (high conﬁdence).\\n[Search Result 4] 87\\nLong-Term Climate and Development Futures\\nSection 3\\nfrom zero or low-carbon sources in 2050, such as renewables or \\nfossil fuels with CO 2 capture and storage, combined with increased \\nelectriﬁcation of energy demand. Such pathways meet energy service \\ndemand with relatively low energy use, through e.g., enhanced energy \\nefﬁciency and behavioural changes and increased electriﬁcation of \\nenergy end use. Modelled global pathways limiting global warming to \\n1.5°C (>50%) with no or limited overshoot generally implement such \\nchanges faster than pathways limiting global warming to 2°C (> 67%). \\n(high conﬁdence ) {WGIII SPM C.3, WGIII SPM C.3.2, WGIII SPM C.4, \\nWGIII TS.4.2; SR1.5 SPM C.2.2}\\nAFOLU mitigation options, when sustainably implemented, can \\ndeliver large-scale GHG emission reductions and enhanced CO 2 \\nremoval; however, barriers to implementation and trade-offs \\nmay result from the impacts of  climate change, competing \\ndemands on land, conﬂicts with food  security and livelihoods, \\nthe complexity of land ownership and management systems, \\nand cultural aspects (see 3.4.1).  A l l  a s s e s s e d  m o d e l l e d  pathways \\nthat limit warming to 2°C (>67%) or lower by 2100 include land-based \\nmitigation and land-use change, with most including different \\ncombinations of reforestation, afforestation, reduced deforestation, and \\nbioenergy. However, accumulated carbon in vegetation and soils is at \\nrisk from future loss (or sink reversal) triggered by climate change and\\n[Search Result 5] 91\\nSection 4\\nNear-Term Responses \\nin a Changing Climate\",\n  \"time\": \"2024-11-15 10:11:51 AM IST+0530\"\n}",
                "status": "success",
                "function_call_id": "call_c1XF43X8Aazdaa818uAQlHQw"
            },
            {
                "id": "message-a3990cb7-fa05-4c7b-91fb-c896d72d7c7f",
                "date": "2024-11-15T04:41:53+00:00",
                "message_type": "internal_monologue",
                "internal_monologue": "I've identified several reliable methods to help reverse climate change. I need to list them clearly for Chad."
            },
            {
                "id": "message-a3990cb7-fa05-4c7b-91fb-c896d72d7c7f",
                "date": "2024-11-15T04:41:53+00:00",
                "message_type": "function_call",
                "function_call": {
                    "name": "send_message",
                    "arguments": "{\n  \"message\": \"High-confidence methods to reverse climate change include: 1) **Restoration of ecosystems** such as wetlands and forests; 2) **Transition to clean energy sources** and electrification; 3) **Enhancing energy efficiency** and adopting sustainable land-use practices; 4) **Utilizing carbon capture and storage** technologies. These strategies can significantly contribute to reducing greenhouse gases and enhancing carbon sinks.\"\n}",
                    "function_call_id": "call_DfTWwqfiU9MwOsWn5LNM5Z4d"
                }
            },
            {
                "id": "message-0d684e7b-5948-4998-80a9-4a26f20a6fff",
                "date": "2024-11-15T04:41:53+00:00",
                "message_type": "function_return",
                "function_return": "{\n  \"status\": \"OK\",\n  \"message\": \"None\",\n  \"time\": \"2024-11-15 10:11:53 AM IST+0530\"\n}",
                "status": "success",
                "function_call_id": "call_DfTWwqfiU9MwOsWn5LNM5Z4d"
            }
        ],
        "usage": {
            "completion_tokens": 175,
            "prompt_tokens": 14071,
            "total_tokens": 14246,
            "step_count": 2
        }
    }
