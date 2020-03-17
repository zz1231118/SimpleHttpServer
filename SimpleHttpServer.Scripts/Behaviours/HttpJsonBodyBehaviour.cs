using System;
using System.Collections.Generic;
using System.Net;
using Framework.JavaScript;
using SimpleHttpServer.Scripts.Utility;

namespace SimpleHttpServer.Scripts.Behaviours
{
    [Obsolete]
    public class HttpJsonBodyBehaviour : HttpBehaviour
    {
        public override void Handle(CSharpScript script)
        {
            if (script.Request.HttpMethod == WebRequestMethods.Http.Post)
            {
                var array = script.Request.ContentType.Split(';');
                var contentType = array[0].ToLower();
                if (contentType == "application/json")
                {
                    var dictionary = (IDictionary<string, string>)script.Form;
                    var arraySegment = HttpUtility.ReadToEnd(script.Request);
                    var jsonString = script.Request.ContentEncoding.GetString(arraySegment.Array, arraySegment.Offset, arraySegment.Count);
                    var json = Json.Parse(jsonString);
                    if (json is JsonObject other)
                    {
                        foreach (var key in other.Keys)
                        {
                            dictionary[key] = other[key]?.ToString();
                        }

                        return;
                    }

                    throw new InvalidOperationException("invalid json format:" + json.GetType().Name);
                }
            }
        }
    }
}
